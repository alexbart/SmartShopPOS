<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';

interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

const searchQuery = ref('');
const cart = ref<CartItem[]>([])
const selectedPayment = ref('CASH');

const { data: products } = useQuery({
  queryKey: ['products-list'],
  queryFn: async () => {
    const response = await apiClient.get<{ items: Product[] }>('/products');
    return response.data.data.items;
  },
});

const filteredProducts = computed(() => {
  if (!products.value) return [];
  const q = searchQuery.value.toLowerCase();
  if (!q) return products.value;
  return products.value.filter((p) =>
    p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  );
});

const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.subtotal, 0));

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

  const response = await apiClient.post('/sales', {
    items: cart.value.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
    paymentMethod: selectedPayment.value,
  });

  if (response.data.success) {
    alert('Sale completed! Sale number: ' + response.data.data.saleNumber);
    clearCart();
  }
}
</script>

<template>
  <div class="p-6 h-[calc(100vh-4rem)] flex gap-6">
    <div class="flex-1">
      <input v-model="searchQuery" type="text" placeholder="Search products..." class="input mb-4" />
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto h-[calc(100vh-8rem)]">
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
      <h2 class="font-bold text-lg mb-4">Shopping Cart</h2>

      <div class="flex-1 overflow-y-auto">
        <div v-if="cart.length === 0" class="text-gray-400 text-center py-8">
          No items in cart
        </div>
        <div v-else class="space-y-3">
          <div v-for="(item, index) in cart" :key="item.productId" class="flex items-center justify-between gap-2">
            <div class="flex-1">
              <p class="text-sm font-medium">{{ item.productName }}</p>
              <p class="text-xs text-gray-500">KES {{ item.price.toLocaleString() }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button @click="updateQuantity(index, -1)" class="w-6 h-6 btn btn-secondary text-xs">-</button>
              <span class="text-sm">{{ item.quantity }}</span>
              <button @click="updateQuantity(index, 1)" class="w-6 h-6 btn btn-secondary text-xs">+</button>
              <button @click="removeFromCart(index)" class="text-red-500 text-sm">×</button>
            </div>
            <span class="text-sm font-medium w-20 text-right">KES {{ item.subtotal.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="border-t pt-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="font-bold">Total</span>
          <span class="text-2xl font-bold text-primary-600">KES {{ cartTotal.toLocaleString() }}</span>
        </div>

        <div class="flex gap-2">
          <button
            v-for="method in ['CASH', 'CARD', 'MPESA', 'BANK']"
            :key="method"
            :class="{'btn btn-primary': selectedPayment === method, 'btn btn-secondary': selectedPayment !== method}"
            @click="selectedPayment = method"
            class="flex-1 text-xs"
          >
            {{ method }}
          </button>
        </div>

        <button
          @click="checkout"
          :disabled="cart.length === 0"
          class="w-full btn btn-primary"
        >
          Complete Sale
        </button>
        <button @click="clearCart" class="w-full btn btn-secondary btn-ghost">
          Clear Cart
        </button>
      </div>
    </div>
  </div>
</template>
