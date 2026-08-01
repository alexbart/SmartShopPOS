<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { ExpenseCategory } from '@/shared/types';

const queryClient = useQueryClient();
const categoryId = ref('');
const amount = ref(0);
const description = ref('');
const expenseDate = ref(new Date().toISOString().split('T')[0]);
const paymentReference = ref('');
const submitting = ref(false);

const { data: categoryResponse } = useQuery({
  queryKey: ['expense-categories'],
  queryFn: async () => {
    const response = await apiClient.get('/finance/categories');
    return response.data.data;
  },
});

const categories = computed(() => (categoryResponse.value ?? []) as ExpenseCategory[]);

const { mutateAsync: submitExpense } = useMutation({
  mutationFn: (payload: any) => apiClient.post('/finance/expenses', payload),
  onSuccess: () => {
    notification.success('Expense recorded');
    queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
  },
  onError: () => {
    // Handled by API interceptor
  },
});

async function handleSubmit() {
  if (!categoryId.value || amount.value <= 0) return;
  submitting.value = true;
  try {
    await submitExpense({
      categoryId: categoryId.value,
      amount: amount.value,
      description: description.value,
      expenseDate: expenseDate.value,
      paymentReference: paymentReference.value,
    });
    categoryId.value = '';
    amount.value = 0;
    description.value = '';
    expenseDate.value = new Date().toISOString().split('T')[0];
    paymentReference.value = '';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Expenses</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="card p-6 max-w-lg space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <select v-model="categoryId" class="input" required>
          <option value="">Select Category</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }} ({{ c.code }})</option>
        </select>
        <input v-model.number="amount" type="number" placeholder="Amount" class="input" required min="0.01" step="0.01" />
        <input v-model="expenseDate" type="date" class="input" required />
        <input v-model="paymentReference" placeholder="Payment Reference" class="input" />
        <input v-model="description" placeholder="Description" class="input" />
      </div>

      <button type="submit" :disabled="submitting" class="btn btn-primary w-full">
        {{ submitting ? 'Recording...' : 'Record Expense' }}
      </button>
    </form>
  </div>
</template>