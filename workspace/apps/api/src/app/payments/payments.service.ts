import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bs58 from 'bs58';
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    clusterApiUrl,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    getMint,
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
} from '@solana/spl-token';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly connection: Connection;
    private readonly treasury: Keypair;
    private readonly mint: PublicKey;

    private mintDecimals: number | null = null;
    private readonly maxPerTx: number;
    private readonly fixedAmount: number;
    private readonly rpcUrl: string;

    constructor(private readonly cfg: ConfigService) {
        // RPC
        this.rpcUrl =
            this.cfg.get<string>('RPC_URL') || clusterApiUrl('mainnet-beta');
        this.connection = new Connection(this.rpcUrl, 'confirmed');

        // Mint
        const mintStr = this.cfg.get<string>('SBC_MINT');
        if (!mintStr) throw new Error('SBC_MINT is not set');
        this.mint = new PublicKey(mintStr);

        // Treasury keypair (base58 or JSON). Accept 64-byte secret or 32-byte seed.
        const b58 = (this.cfg.get<string>('TREASURY_SECRET_BASE58') || '').trim();
        const json = (this.cfg.get<string>('TREASURY_SECRET_JSON') || '').trim();

        if (b58) {
            const raw = bs58.decode(b58);
            if (raw.length === 64) {
                this.treasury = Keypair.fromSecretKey(raw);
            } else if (raw.length === 32) {
                // Interpret as seed (ed25519)
                this.treasury = Keypair.fromSeed(raw);
                this.logger.warn(
                    'TREASURY_SECRET_BASE58 appears to be a 32-byte seed; deriving keypair from seed.',
                );
            } else {
                throw new Error(
                    `TREASURY_SECRET_BASE58 decodes to ${raw.length} bytes (need 64 for secret key or 32 for seed).`,
                );
            }
        } else if (json) {
            const arr = Uint8Array.from(JSON.parse(json));
            if (arr.length === 64) {
                this.treasury = Keypair.fromSecretKey(arr);
            } else if (arr.length === 32) {
                this.treasury = Keypair.fromSeed(arr);
                this.logger.warn(
                    'TREASURY_SECRET_JSON looks like a 32-byte seed; deriving keypair from seed.',
                );
            } else {
                throw new Error(
                    `TREASURY_SECRET_JSON length ${arr.length} is invalid (need 64 or 32).`,
                );
            }
        } else {
            throw new Error(
                'Missing treasury secret: set TREASURY_SECRET_BASE58 or TREASURY_SECRET_JSON',
            );
        }

        this.maxPerTx = Number(this.cfg.get<string>('MAX_SBC_PER_TX') || 5);
        this.fixedAmount = Number(this.cfg.get<string>('FIXED_AMOUNT') || 1);

        this.logger.log(
            `RPC=${this.rpcUrl}, Mint=${this.mint.toBase58()}, Treasury=${this.treasury.publicKey.toBase58()}`,
        );
    }

    resolveAmount(input?: number): number {
        if (typeof input === 'number') return input;
        return this.fixedAmount;
    }

    /** Friendlier mint fetch with a clear message if the mint is not on the current cluster. */
    private async ensureMintDecimals(): Promise<number> {
        if (this.mintDecimals !== null) return this.mintDecimals;

        try {
            const mi = await getMint(this.connection, this.mint);
            this.mintDecimals = mi.decimals;
            return this.mintDecimals!;
        } catch (e: any) {
            const msg =
                `Mint not found on current cluster.\n` +
                `• Check RPC_URL (${this.rpcUrl}) vs SBC_MINT (${this.mint.toBase58()}).\n` +
                `• If you’re on devnet, use a devnet test mint (and mint tokens to the treasury).\n` +
                `• If you’re on mainnet, use the real SBC mint and fund the treasury with SBC + a little SOL.`;
            this.logger.error(msg);
            throw new Error(msg);
        }
    }

    async transferSbc(recipient: string, amount: number) {
        // Basic validations
        let dest: PublicKey;
        try {
            dest = new PublicKey(recipient);
        } catch {
            throw new Error('Invalid recipient address (not a valid base58 public key).');
        }
        if (!isFinite(amount) || amount <= 0) {
            throw new Error('Invalid amount (must be > 0).');
        }
        if (amount > this.maxPerTx) {
            throw new Error(`Amount exceeds per-tx limit (${this.maxPerTx} SBC).`);
        }

        const decimals = await this.ensureMintDecimals();
        const units = BigInt(Math.round(amount * 10 ** decimals));

        try {
            // Ensure ATAs (treasury pays rent if not existing)
            const recipientAta = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.treasury, // payer
                this.mint,
                dest,
                true, // allowOwnerOffCurve
            );

            const treasuryAta = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.treasury,
                this.mint,
                this.treasury.publicKey,
            );

            // Build transfer
            const ix = createTransferInstruction(
                treasuryAta.address,
                recipientAta.address,
                this.treasury.publicKey,
                Number(units),
            );

            const tx = new Transaction().add(ix);
            tx.feePayer = this.treasury.publicKey;
            tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

            // Sign + send
            const sig = await sendAndConfirmTransaction(
                this.connection,
                tx,
                [this.treasury],
                { commitment: 'confirmed' },
            );

            const isDevnet = this.rpcUrl.includes('devnet');
            const explorer = `https://explorer.solana.com/tx/${sig}${isDevnet ? '?cluster=devnet' : ''
                }`;

            this.logger.log(
                `Sent ${amount} SBC to ${dest.toBase58()} — ${sig}`,
            );

            return { ok: true, signature: sig, explorer };
        } catch (e: any) {
            // Common failure modes explained in one place
            const hintLines = [
                'Transfer failed.',
                `• RPC_URL: ${this.rpcUrl}`,
                `• Mint: ${this.mint.toBase58()}`,
                `• Treasury: ${this.treasury.publicKey.toBase58()}`,
                'Troubleshooting:',
                '• Ensure treasury has enough SOL for fees.',
                '• If this is the first transfer to the recipient, creating their token account (ATA) costs rent.',
                '• On devnet, airdrop SOL to the treasury and make sure you’re using a devnet test mint with a positive balance.',
            ];
            const friendly = `${hintLines.join('\n')}\n• Raw: ${e?.message || e}`;
            this.logger.error(friendly);
            throw new Error(friendly);
        }
    }
}
