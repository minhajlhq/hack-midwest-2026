// src/app/SbcAgentSim.tsx
import React, { useState } from 'react';

// ====== CONFIG (edit these) ======
const RECIPIENT_ADDRESS = 'CNwALjGcEQiXU8JajZBUDoa135HEZV1qR6nBwUeMss5c'; // <- hard-code your user's wallet here
const FIXED_AMOUNT = 1; // <- hard-code how much SBC to send each click

// Backend location (no auth)
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const TRANSFER_PATH = import.meta.env.VITE_TRANSFER_PATH || '/api/payments/sbc/transfer';
// Full endpoint your backend exposes:
const TRANSFER_URL = `${API_BASE}${TRANSFER_PATH}`;
// =================================

export default function SbcAgentSim() {
    const [status, setStatus] = useState<string>('');
    const [busy, setBusy] = useState<boolean>(false);
    const [lastSig, setLastSig] = useState<string>('');
    const [lastExplorer, setLastExplorer] = useState<string>('');

    const send = async () => {
        if (!RECIPIENT_ADDRESS || RECIPIENT_ADDRESS === 'REPLACE_WITH_USER_WALLET') {
            setStatus('❌ Set RECIPIENT_ADDRESS in SbcAgentSim.tsx first.');
            return;
        }
        try {
            setBusy(true);
            setStatus('Sending request to backend…');

            const resp = await fetch(TRANSFER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, // no API key
                body: JSON.stringify({
                    recipient: RECIPIENT_ADDRESS,
                    amount: FIXED_AMOUNT,
                }),
            });

            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(data?.error || `HTTP ${resp.status}`);
            }

            // Expecting backend to return: { ok, signature, explorer? }
            const sig = data.signature || 'NO_SIGNATURE_RETURNED';
            const explorer = data.explorer || '';

            setLastSig(sig);
            setLastExplorer(explorer);
            setStatus(`✅ Transfer requested: ${FIXED_AMOUNT} SBC → ${RECIPIENT_ADDRESS}\nSignature: ${sig}`);
        } catch (e: any) {
            setStatus(`❌ ${e?.message || 'Backend call failed'}`);
            setLastSig('');
            setLastExplorer('');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ maxWidth: 640, margin: '2rem auto', padding: 16 }}>
            <h1>Agent Payout (Frontend Trigger)</h1>
            <p style={{ opacity: 0.8 }}>
                Click the button to send a POST to your backend with a hard-coded amount and recipient.
                The backend uses the <b>treasury</b> account (stored server-side) to transfer SBC.
            </p>

            <div style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                <div><b>Recipient (hard-coded):</b></div>
                <code style={{ userSelect: 'all' }}>{RECIPIENT_ADDRESS}</code>
                <div style={{ marginTop: 8 }}>
                    <b>Amount (hard-coded):</b> {FIXED_AMOUNT} SBC
                </div>
                <div style={{ marginTop: 8 }}>
                    <b>Backend endpoint:</b> <code>{TRANSFER_URL}</code>
                </div>
            </div>

            <div style={{ marginTop: 16 }}>
                <button
                    onClick={send}
                    disabled={busy}
                    style={{ padding: '10px 18px', fontSize: 16, borderRadius: 8, cursor: 'pointer' }}
                >
                    {busy ? 'Sending…' : `Send ${FIXED_AMOUNT} SBC (POST)`}
                </button>
            </div>

            {!!status && (
                <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', padding: 12, background: '#fafafa', borderRadius: 8 }}>
                    {status}
                </pre>
            )}

            {lastExplorer ? (
                <div style={{ marginTop: 8 }}>
                    <a href={lastExplorer} target="_blank" rel="noreferrer">
                        View on Solana Explorer
                    </a>
                </div>
            ) : null}
        </div>
    );
}
