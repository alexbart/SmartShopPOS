<script setup lang="ts">
import { useRoute } from 'vue-router';
import ReceiptPreview from '@/modules/sales/components/ReceiptPreview.vue';

const route = useRoute();
const receiptId = route.params.id as string;
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="max-w-md mx-auto">
      <ReceiptPreview
        :receipt="{
          number: receiptId || '',
          items: [],
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
          paymentMethod: 'CASH',
          timestamp: '',
          cashier: 'Alex',
        }"
      />
    </div>
  </div>
</template>
