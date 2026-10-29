import { getDarajaConfig } from '../../config/daraja.config.js';
import { getDarajaToken } from './daraja-token.service.js';

export interface StkPushResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

/**
 * Initiates a Daraja STK Push (Lipa Na M-Pesa Online).
 * Returns Safaricom's CheckoutRequestID which is stored as darajaRequestId.
 * Does NOT indicate payment success — only that the push was accepted.
 */
export async function initiateStkPush(opts: {
  phone: string;
  amount: number;
  accountReference: string; // e.g. sale number
  transactionDesc: string;
}): Promise<StkPushResult> {
  const config = getDarajaConfig();
  const token = await getDarajaToken();

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14); // YYYYMMDDHHmmss

  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString(
    'base64',
  );

  // Normalize phone: 07XXXXXXXX → 2547XXXXXXXX
  const phone = opts.phone.replace(/^0/, '254').replace(/^\+/, '');

  const body = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: config.transactionType,
    Amount: Math.ceil(opts.amount), // Safaricom requires integer
    PartyA: phone,
    PartyB: config.shortcode,
    PhoneNumber: phone,
    CallBackURL: config.callbackUrl,
    AccountReference: opts.accountReference.slice(0, 12), // max 12 chars
    TransactionDesc: opts.transactionDesc.slice(0, 13), // max 13 chars
  };

  const response = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`STK Push failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    CheckoutRequestID: string;
    MerchantRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
  };

  if (data.ResponseCode !== '0') {
    throw new Error(`STK Push rejected: ${data.ResponseDescription}`);
  }

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
    customerMessage: data.CustomerMessage,
  };
}
