<script setup lang="ts">
import {
  PauseCircle,
  RotateCcw,
  Gift,
  Copy,
  Trash2,
} from '@lucide/vue';
import { Button } from '@/components/ui/button';

const emit = defineEmits<{
  (e: 'suspend'): void;
  (e: 'recall'): void;
  (e: 'discount'): void;
  (e: 'split'): void;
  (e: 'clear'): void;
}>();
</script>

<template>
  <div>
    <h3 class="text-xs font-medium text-muted-foreground uppercase mb-2">Quick Actions</h3>
    <div class="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" class="gap-1.5" @click="$emit('suspend')">
        <PauseCircle class="w-3.5 h-3.5" />
        Suspend (F8)
      </Button>
      <Button variant="outline" size="sm" class="gap-1.5" @click="$emit('recall')">
        <Copy class="w-3.5 h-3.5" />
        Recall Sale
      </Button>
      <Button variant="outline" size="sm" class="gap-1.5" @click="$emit('discount')">
        <Gift class="w-3.5 h-3.5" />
        Discount
      </Button>
      <Button variant="outline" size="sm" class="gap-1.5" @click="$emit('split')">
        <RotateCcw class="w-3.5 h-3.5" />
        Split Payment
      </Button>
      <Button variant="outline" size="sm" class="gap-1.5" @click="$emit('clear')">
        <Trash2 class="w-3.5 h-3.5" />
        Clear Cart
      </Button>
    </div>
  </div>
</template>
