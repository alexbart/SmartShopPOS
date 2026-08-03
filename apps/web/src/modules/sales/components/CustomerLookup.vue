<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { User, X, Search } from '@lucide/vue';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/shared/lib/api-client';
import type { Customer } from '@/modules/sales/composables/types';

defineProps<{ selectedCustomer?: Customer | null }>();

const emit = defineEmits<{
  (e: 'select', customer: Customer): void;
  (e: 'clear'): void;
}>();

const searchQuery = ref('');
const focused = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const { data: customersData } = useQuery({
  queryKey: ['customers-pos'],
  queryFn: async () => {
    const res = await apiClient.get('/customers', { params: { limit: '200' } });
    return res.data.data.items as Customer[];
  },
  staleTime: 120_000,
});

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const q = searchQuery.value.toLowerCase();
  return (customersData.value ?? [])
    .filter((c) => c.name.toLowerCase().includes(q) || (c.phone?.includes(q) ?? false))
    .slice(0, 8);
});

function select(customer: Customer) {
  emit('select', customer);
  searchQuery.value = '';
  focused.value = false;
}

function clear() {
  emit('clear');
  searchQuery.value = '';
}

function onBlur() {
  setTimeout(() => { focused.value = false; }, 150);
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <!-- Selected customer chip -->
  <div v-if="selectedCustomer" class="flex items-center gap-2 px-2 py-1.5 bg-muted/40 rounded-lg border border-border">
    <User class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    <span class="text-sm font-medium flex-1 truncate">{{ selectedCustomer.name }}</span>
    <button @click="clear" class="text-muted-foreground hover:text-foreground transition-colors">
      <X class="w-3.5 h-3.5" />
    </button>
  </div>

  <!-- Search input -->
  <div v-else class="relative">
    <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    <Input
      ref="inputRef"
      v-model="searchQuery"
      placeholder="Customer (optional) — F3"
      class="pl-8 h-8 text-sm"
      @focus="focused = true"
      @blur="onBlur"
    />

    <div
      v-if="focused && filtered.length > 0"
      class="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-20 overflow-hidden"
    >
      <button
        v-for="customer in filtered"
        :key="customer.id"
        @mousedown.prevent="select(customer)"
        class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        <User class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ customer.name }}</p>
          <p v-if="customer.phone" class="text-xs text-muted-foreground">{{ customer.phone }}</p>
        </div>
      </button>
    </div>
  </div>
</template>
