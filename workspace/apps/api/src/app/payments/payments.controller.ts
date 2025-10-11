import {
    Body,
    Controller,
    HttpException,
    HttpStatus,
    Post,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

class TransferDto {
    recipient!: string; // Solana address (base58)
    amount?: number;    // optional; falls back to FIXED_AMOUNT
}

@Controller('payments')
export class PaymentsController {
    constructor(private readonly svc: PaymentsService) { }

    @Post('sbc/transfer')
    async transfer(@Body() body: TransferDto) {
        const { recipient, amount } = body || {};
        if (!recipient) {
            throw new HttpException('recipient is required', HttpStatus.BAD_REQUEST);
        }
        const amt = this.svc.resolveAmount(amount);
        if (!isFinite(amt) || amt <= 0) {
            throw new HttpException('invalid amount', HttpStatus.BAD_REQUEST);
        }
        const res = await this.svc.transferSbc(recipient, amt);
        return res; // { ok, signature, explorer }
    }
}
