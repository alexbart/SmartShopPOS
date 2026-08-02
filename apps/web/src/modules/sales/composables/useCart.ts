import { ref, computed, watch } from 'vue';
import { nanoid } from 'nanoid';
import { useQuery } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import type { Product } from '@/shared/types';
import type { PosCartItem, ReceiptData, Customer, PaymentMethod } from './types';

const CART_STORAGE_KEY = 'pos-cart';
const POS_STATE_KEY = 'pos-state';

function loadCart(): PosCartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveCart(cartItems: PosCartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
}

function loadPosState() {
  try {
    const stored = localStorage.getItem(POS_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    selectedPaymentMethod: 'CASH' as PaymentMethod,
    customerId: null as string | null,
    customerName: null as string | null,
    selectedTaxId: null as string | null,
  };
}

function savePosState(state: {
  selectedPaymentMethod: PaymentMethod;
  customerId: string | null;
  customerName: string | null;
  selectedTaxId: string | null;
}) {
  localStorage.setItem(POS_STATE_KEY, JSON.stringify(state));
}

export function useCart() {
  const items = ref<PosCartItem[]>(loadCart());
  const savedState = loadPosState();
  const selectedPaymentMethod = ref<PaymentMethod>(savedState.selectedPaymentMethod);
  const customerId = ref<string | null>(savedState.customerId);
  const customerName = ref<string | null>(savedState.customerName);
  // null = no tax applied
  const selectedTaxId = ref<string | null>(savedState.selectedTaxId ?? null);

  const { data: taxesData } = useQuery({
    queryKey: ['taxes'],
    queryFn: async () => {
      const res = await apiClient.get('/taxes');
      return res.data.data.items as Array<{ id: string; name: string; code: string; rate: number }>;
    },
    staleTime: 300_000,
  });

  const taxes = computed(() => taxesData.value ?? []);

  const selectedTax = computed(() => taxes.value.find((t) => t.id === selectedTaxId.value) ?? null);

  const taxRate = computed(() => (selectedTax.value ? selectedTax.value.rate / 100 : 0));

  function setTax(taxId: string | null) {
    selectedTaxId.value = taxId;
    savePosState({
      selectedPaymentMethod: selectedPaymentMethod.value,
      customerId: customerId.value,
      customerName: customerName.value,
      selectedTaxId: taxId,
    });
  }

  function getProductKey(product: Product): string {
    return product.id;
  }

  function addItem(product: Product, quantity: number = 1): PosCartItem {
    const key = getProductKey(product);
    const existing = items.value.find((i) => i.product.id === key);
    if (existing) {
      existing.quantity += quantity;
      existing.subtotal = calculateSubtotal(existing);
      return existing;
    }
    const item: PosCartItem = {
      id: nanoid(),
      product,
      quantity,
      price: product.sellingPrice,
      discount: 0,
      note: '',
      subtotal: product.sellingPrice * quantity,
    };
    items.value.push(item);
    return item;
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id);
  }

  function updateQuantity(id: string, quantity: number) {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;
    item.quantity = Math.max(1, quantity);
    item.subtotal = calculateSubtotal(item);
  }

  function setDiscount(id: string, discount: number) {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;
    item.discount = Math.max(0, discount);
    item.subtotal = calculateSubtotal(item);
  }

  function setNote(id: string, note: string) {
    const item = items.value.find((i) => i.id === id);
    if (item) item.note = note;
  }

  function calculateSubtotal(item: PosCartItem): number {
    const lineTotal = item.price * item.quantity;
    return lineTotal - item.discount;
  }

  function clearCart() {
    items.value = [];
    saveCart([]);
  }

  function setCustomer(customer: Customer) {
    customerId.value = customer.id;
    customerName.value = customer.name;
    savePosState({
      selectedPaymentMethod: selectedPaymentMethod.value,
      customerId: customer.id,
      customerName: customer.name,
      selectedTaxId: selectedTaxId.value,
    });
  }

  function clearCustomer() {
    customerId.value = null;
    customerName.value = null;
    savePosState({
      selectedPaymentMethod: selectedPaymentMethod.value,
      customerId: null,
      customerName: null,
      selectedTaxId: selectedTaxId.value,
    });
  }

  function setPaymentMethod(method: PaymentMethod) {
    selectedPaymentMethod.value = method;
    savePosState({
      selectedPaymentMethod: method,
      customerId: customerId.value,
      customerName: customerName.value,
      selectedTaxId: selectedTaxId.value,
    });
  }

  function getItemSubtotal(item: PosCartItem): number {
    return item.price * item.quantity - item.discount;
  }

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + getItemSubtotal(item), 0),
  );

  watch(items, (newItems) => {
    saveCart(newItems);
  });

  const totalDiscount = computed(() => items.value.reduce((sum, item) => sum + item.discount, 0));

  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));

  const isEmpty = computed(() => items.value.length === 0);

  const tax = computed(() => subtotal.value * taxRate.value);

  const total = computed(() => subtotal.value + tax.value - totalDiscount.value);

  function toReceiptData(cashier: string = 'Alex'): ReceiptData {
    return {
      number: `INV-${Date.now().toString().slice(-6)}`,
      items: items.value.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: getItemSubtotal(item),
      })),
      subtotal: subtotal.value,
      tax: tax.value,
      discount: totalDiscount.value,
      total: total.value,
      paymentMethod: 'CASH',
      timestamp: new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }),
      cashier,
    };
  }

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    setNote,
    clearCart,
    setCustomer,
    clearCustomer,
    setPaymentMethod,
    setTax,
    selectedPaymentMethod,
    customerId,
    customerName,
    selectedTaxId,
    selectedTax,
    taxes,
    subtotal,
    tax,
    totalDiscount,
    total,
    itemCount,
    isEmpty,
    getItemSubtotal,
    toReceiptData,
  };
}
