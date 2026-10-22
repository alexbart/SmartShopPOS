import type { FastifyRequest, FastifyReply } from 'fastify';
import type { PaymentService } from '../service/payment.service.js';

/**
 * Handles the Safaricom Daraja STK Push callback.
 * This endpoint is called by Safaricom — no JWT auth.
 * Must always return 200 to Safaricom regardless of our internal outcome.
 */
export class DarajaCallbackController {
  constructor(private readonly _paymentService: PaymentService) {}

  async handleStkCallback(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as DarajaCallbackBody;
      const stk = body?.Body?.stkCallback;

      if (!stk) {
        return reply.status(200).send({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      const checkoutRequestId: string = stk.CheckoutRequestID;
      const resultCode: number = stk.ResultCode;

      if (resultCode === 0) {
        // Success — extract MpesaReceiptNumber from CallbackMetadata
        const items: Array<{ Name: string; Value: string | number }> =
          stk.CallbackMetadata?.Item ?? [];
        const receiptItem = items.find((i) => i.Name === 'MpesaReceiptNumber');
        const mpesaReceiptNumber = receiptItem ? String(receiptItem.Value) : undefined;

        await this._paymentService.confirmMpesaPayment(checkoutRequestId, mpesaReceiptNumber);
      } else {
        await this._paymentService.failMpesaPayment(checkoutRequestId, stk.ResultDesc);
      }
    } catch {
      // Never let an internal error cause a non-200 to Safaricom — they will retry
    }

    return reply.status(200).send({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

interface DarajaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}
