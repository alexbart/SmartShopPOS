import type { Product } from '@/shared/types';

export interface PosCartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  discount: number;
  note: string;
  subtotal: number;
}

// UI-level method — includes SPLIT as a selection
export type PaymentMethod = 'CASH' | 'CARD' | 'MPESA' | 'BANK' | 'SPLIT';

// Backend-level method — SPLIT is never sent to /payments
export type RecordedPaymentMethod = 'CASH' | 'CARD' | 'MPESA' | 'BANK';

export interface SplitPayment {
  method: RecordedPaymentMethod;
  amount: number;
  reference?: string;
}

// Structured payload emitted by PaymentDrawer
export interface PaymentPayload {
  method: PaymentMethod;
  amount: number;
  tendered?: number;
  change?: number;
  reference?: string;
  phone?: string;
  split?: SplitPayment[];
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface PosSale {
  cartItems: PosCartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  tenderedAmount?: number;
  change?: number;
  reference?: string;
  phone?: string;
  splitPayments?: SplitPayment[];
  customerId?: string;
  customerName?: string;
  receiptNumber?: string;
  timestamp?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  number: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  timestamp: string;
  cashier: string;
}

export interface OfflineQueueItem {
  id: string;
  sale: PosSale;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}

// Result returned by processSale — lets POS distinguish sale+payment outcomes
export interface ProcessSaleResult {
  success: boolean;
  saleId?: string;
  saleNumber?: string;
  paymentSuccess: boolean;
  paymentError?: string;
}
