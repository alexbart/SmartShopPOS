<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PosSale } from '@/modules/sales/composables/types';
import { Clock, Play, Trash2, Search } from '@lucide/vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const props = withDefaults(
  defineProps<{
    open: boolean;
    sales: PosSale[];
  }>(),
  { open: false, sales: () => [] },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'resume', sale: PosSale): void;
  (e: 'delete', sale: PosSale): void;
}>();

const searchQuery = ref('');

const filtered = computed(() => {
  if (!searchQuery.value) return props.sales;
  const q = searchQuery.value.toLowerCase();
  return props.sales.filter(
    (s) =>
      s.customerName?.toLowerCase().includes(q) ||
      String(s.total).includes(q) ||
      new Date(s.timestamp ?? '').toLocaleTimeString().toLowerCase().includes(q),
  );
});

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Suspended Sales</DialogTitle>
      </DialogHeader>

      <div class="space-y-3">
        <div class="relative">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search suspended sales..."
            class="pl-8 h-8"
          />
        </div>

        <Card v-if="filtered.length === 0">
          <CardContent class="pt-6 text-center">
            <Clock class="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p class="text-sm text-muted-foreground">
              No suspended sales
            </p>
          </CardContent>
        </Card>

        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="sale in filtered"
            :key="sale.timestamp"
            class="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
          >
            <div class="flex items-center gap-3">
              <Clock class="w-4 h-4 text-muted-foreground" />
              <div>
                <p class="font-medium text-sm">
                  {{ sale.customerName || 'Walk-in Customer' }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ formatTime(sale.timestamp || '') }} •
                  KES {{ sale.total?.toLocaleString() }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                class="h-7"
                @click="$emit('resume', sale)"
              >
                <Play class="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-7 text-red-500"
                @click="$emit('delete', sale)"
              >
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
