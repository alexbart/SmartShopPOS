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

export type PaymentMethod = 'CASH' | 'CARD' | 'MPESA' | 'BANK' | 'SPLIT';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface SplitPayment {
  method: PaymentMethod;
  amount: number;
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
