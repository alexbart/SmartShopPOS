<script setup lang="ts">
import { ref, computed } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { useQuery } from '@tanstack/vue-query';

const { data: categoryResponse } = useQuery({
  queryKey: ['expense-categories'],
  queryFn: async () => {
    const response = await apiClient.get('/finance/categories');
    return response.data.data;
  },
});

const categories = computed(() => categoryResponse.value ?? []);

const form = ref({
  categoryId: '',
  amount: 0,
  description: '',
  expenseDate: new Date().toISOString().split('T')[0],
  paymentReference: '',
});

async function handleSubmit() {
  await apiClient.post('/finance/expenses', form.value);
  alert('Expense recorded!');
  form.value = {
    categoryId: '',
    amount: 0,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
  };
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Expenses</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="card p-6 max-w-lg space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <select v-model="form.categoryId" class="input" required>
          <option value="">Select Category</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }} ({{ c.code }})</option>
        </select>
        <input v-model.number="form.amount" type="number" placeholder="Amount" class="input" required />
        <input v-model="form.expenseDate" type="date" class="input" required />
        <input v-model="form.paymentReference" placeholder="Payment Reference" class="input" />
        <input v-model="form.description" placeholder="Description" class="input" />
      </div>
      <button type="submit" class="btn btn-primary">Record Expense</button>
    </form>
  </div>
</template>
