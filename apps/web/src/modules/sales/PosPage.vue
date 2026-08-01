<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Product } from '@/shared/types';

const queryClient = useQueryClient();
const searchQuery = ref('');
const cart = ref<CartItem[]>([]);
const selectedPayment = ref('CASH');
const checkoutLoading = ref(false);

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

const { data: productsData, isLoading: productsLoading } = useQuery({
  queryKey: ['products-list'],
  queryFn: async () => {
    const response = await apiClient.get<{ items: Product[] }>('/products');
    return response.data.data;
  },
});

const { data: warehousesData } = useQuery({
  queryKey: ['warehouses-list'],
  queryFn: async () => {
    const response = await apiClient.get<{ items: Array<{ id: string; name: string; isDefault: boolean }> }>('/warehouses');
    return response.data.data;
  },
});

const products = computed(() => productsData?.value?.items ?? []);
const warehouses = computed(() => warehousesData?.value?.items ?? []);

const defaultWarehouseId = computed(() => {
  if (!warehouses.value.length) return null;
  const def = warehouses.value.find((w) => w.isDefault);
  return def ? def.id : warehouses.value[0]?.id ?? null;
});

const filteredProducts = computed(() => {
  if (!products.value) return [];
  const q = searchQuery.value.toLowerCase();
  if (!q) return products.value;
  return products.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q),
  );
});

const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.subtotal, 0));
const cartItemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));

function addToCart(product: Product) {
  const existing = cart.value.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity += 1;
    existing.subtotal = existing.quantity * existing.price;
  } else {
    cart.value.push({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.sellingPrice,
      subtotal: product.sellingPrice,
    });
  }
}

function removeFromCart(index: number) {
  cart.value.splice(index, 1);
}

function updateQuantity(index: number, delta: number) {
  const item = cart.value[index];
  item.quantity += delta;
  if (item.quantity < 1) item.quantity = 1;
  item.subtotal = item.quantity * item.price;
}

function clearCart() {
  cart.value = [];
}

async function checkout() {
  if (cart.value.length === 0) return;
  if (!defaultWarehouseId.value) {
    notification.error('No warehouse found. Please set up warehouses first.');
    return;
  }

  checkoutLoading.value = true;
  try {
    const response = await apiClient.post('/sales', {
      warehouseId: defaultWarehouseId.value,
      items: cart.value.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod: selectedPayment.value,
    });

    if (response.data.success) {
      notification.success('Sale completed!', `Sale #${response.data.data.number}`);
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      clearCart();
    }
  } catch (e: any) {
    // Error handled by API interceptor
  } finally {
    checkoutLoading.value = false;
  }
}
</script>

<template>
  <div class="p-6 h-[calc(100vh-4rem)] flex gap-6">
    <div class="flex-1">
      <div class="flex gap-2 mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="input flex-1"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="btn btn-ghost btn-sm"
        >
          Clear
        </button>
      </div>

      <div
        v-if="productsLoading"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto h-[calc(100vh-8rem)]"
      >
        <div v-for="i in 8" :key="i" class="card p-3 animate-pulse">
          <div class="h-4 bg-gray-200 rounded mb-1"></div>
          <div class="h-3 bg-gray-200 rounded mb-1 w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded mt-2 w-1/2"></div>
        </div>
      </div>

      <div
        v-else-if="filteredProducts.length === 0"
        class="text-center py-12 text-gray-500 h-[calc(100vh-8rem)] flex flex-col items-center justify-center"
      >
        <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0l.707.707A2 2 0 0018 15.656V8a6 6 0 00-12 0v7.656a2 2 0 003.414 1.414l.707.707a4 4 0 00.586-.586z" />
        </svg>
        <p>No products found</p>
      </div>

      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto h-[calc(100vh-8rem)]"
      >
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          @click="addToCart(product)"
          class="card p-3 cursor-pointer hover:shadow-md transition-shadow"
        >
          <h3 class="font-medium text-sm">{{ product.name }}</h3>
          <p class="text-xs text-gray-500">{{ product.code }} / {{ product.sku }}</p>
          <p class="text-lg font-bold text-primary-600">KES {{ product.sellingPrice.toLocaleString() }}</p>
          <p class="text-xs text-gray-500">Stock: {{ product.stockQuantity }}</p>
        </div>
      </div>
    </div>

    <div class="w-80 card p-4 flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-bold text-lg">Shopping Cart</h2>
        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{{ cartItemCount }} items</span>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div
          v-if="cart.length === 0"
          class="text-gray-400 text-center py-8 flex flex-col items-center"
        >
          <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 3h2m7 0h1m4 0h2m-5 0v19m-5-19v19"></path>
          </svg>
          <p>No items in cart</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(item, index) in cart"
            :key="item.productId"
            class="flex items-center justify-between gap-2"
          >
            <div class="flex-1">
              <p class="text-sm font-medium">{{ item.productName }}</p>
              <p class="text-xs text-gray-500">KES {{ item.price.toLocaleString() }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="updateQuantity(index, -1)"
                class="w-6 h-6 btn btn-secondary text-xs"
              >
                -
              </button>
              <span class="text-sm">{{ item.quantity }}</span>
              <button
                @click="updateQuantity(index, 1)"
                class="w-6 h-6 btn btn-secondary text-xs"
              >
                +
              </button>
              <button
                @click="removeFromCart(index)"
                class="text-red-500 text-sm hover:text-red-700"
              >
                ×
              </button>
            </div>
            <span class="text-sm font-medium w-20 text-right">
              KES {{ item.subtotal.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <div class="border-t pt-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="font-bold text-lg">Total</span>
          <span class="text-2xl font-bold text-primary-600">
            KES {{ cartTotal.toLocaleString() }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="method in ['CASH', 'CARD', 'MPESA', 'BANK']"
            :key="method"
            @click="selectedPayment = method"
            :class="{
              'btn btn-primary': selectedPayment === method,
              'btn btn-outline': selectedPayment !== method,
            }"
            class="text-xs"
          >
            {{ method }}
          </button>
        </div>

        <button
          @click="checkout"
          :disabled="cart.length === 0 || checkoutLoading"
          class="w-full btn btn-primary"
        >
          <svg
            v-if="checkoutLoading"
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          </svg>
          {{ checkoutLoading ? 'Completing...' : 'Complete Sale' }}
        </button>
        <button
          @click="clearCart"
          class="w-full btn btn-ghost"
        >
          Clear Cart
        </button>
      </div>
    </div>
  </div>
</template>
