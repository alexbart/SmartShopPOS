<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ReceiptPreview from '@/modules/sales/components/ReceiptPreview.vue';
import { useOrganizationStore } from '@/stores/organization';

const route = useRoute();
const organizationStore = useOrganizationStore();
const receiptId = route.params.id as string;

onMounted(() => {
  void organizationStore.ensureLoaded();
});
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="max-w-md mx-auto">
      <ReceiptPreview
        :branding="organizationStore.branding"
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
