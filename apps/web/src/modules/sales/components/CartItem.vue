<script setup lang="ts">
import { ref } from 'vue';
import type { PosCartItem } from '@/modules/sales/composables/types';
import ProductAvatar from '@/modules/catalog/components/ProductAvatar.vue';
import { Plus, Minus, Trash2, Tag, MessageSquare } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const props = defineProps<{ item: PosCartItem }>();

const emit = defineEmits<{
  (e: 'update-qty', id: string, qty: number): void;
  (e: 'remove', id: string): void;
  (e: 'discount', id: string, amount: number): void;
  (e: 'note', id: string, note: string): void;
}>();

const showDiscount = ref(false);
const discountInput = ref('');
const showNote = ref(false);
const noteInput = ref('');

function applyDiscount() {
  emit('discount', props.item.id, parseFloat(discountInput.value) || 0);
  showDiscount.value = false;
}

function applyNote() {
  emit('note', props.item.id, noteInput.value);
  showNote.value = false;
}
</script>

<template>
  <div class="rounded-lg border border-border/50 hover:border-border transition-colors">
    <!-- Main row -->
    <div class="flex items-center gap-2 p-2">
      <ProductAvatar :src="item.product.imageUrl" :alt="item.product.name" size="sm" />

      <div class="flex-1 min-w-0">
        <p class="font-medium text-sm truncate">{{ item.product.name }}</p>
        <p class="text-xs text-muted-foreground/70 font-mono">{{ item.product.code || item.product.sku || '—' }}</p>
      </div>

      <!-- Qty controls -->
      <div class="flex items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" class="h-6 w-6" @click="emit('update-qty', item.id, item.quantity - 1)">
          <Minus class="w-3 h-3" />
        </Button>
        <span class="text-sm font-semibold w-6 text-center tabular-nums">{{ item.quantity }}</span>
        <Button variant="ghost" size="icon-sm" class="h-6 w-6" @click="emit('update-qty', item.id, item.quantity + 1)">
          <Plus class="w-3 h-3" />
        </Button>
      </div>

      <!-- Line total -->
      <div class="text-right w-16 shrink-0">
        <p class="text-sm font-semibold tabular-nums">KES {{ (item.price * item.quantity - item.discount).toLocaleString() }}</p>
        <p v-if="item.discount > 0" class="text-xs text-green-600">-{{ item.discount }}</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost" size="icon-sm" class="h-6 w-6"
          :class="showDiscount ? 'text-primary' : 'text-muted-foreground'"
          @click="showDiscount = !showDiscount; showNote = false; discountInput = String(item.discount || '')"
        >
          <Tag class="w-3 h-3" />
        </Button>
        <Button
          variant="ghost" size="icon-sm" class="h-6 w-6"
          :class="showNote ? 'text-primary' : 'text-muted-foreground'"
          @click="showNote = !showNote; showDiscount = false; noteInput = item.note"
        >
          <MessageSquare class="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon-sm" class="h-6 w-6 text-red-400 hover:text-red-600" @click="emit('remove', item.id)">
          <Trash2 class="w-3 h-3" />
        </Button>
      </div>
    </div>

    <!-- Inline discount input -->
    <div v-if="showDiscount" class="flex items-center gap-2 px-2 pb-2">
      <Tag class="w-3 h-3 text-muted-foreground shrink-0" />
      <Input
        v-model="discountInput"
        type="number"
        placeholder="Discount amount (KES)"
        class="h-7 text-xs flex-1"
        @keydown.enter="applyDiscount"
        @keydown.escape="showDiscount = false"
        autofocus
      />
      <Button size="sm" class="h-7 text-xs px-2" @click="applyDiscount">Apply</Button>
    </div>

    <!-- Inline note input -->
    <div v-if="showNote" class="flex items-center gap-2 px-2 pb-2">
      <MessageSquare class="w-3 h-3 text-muted-foreground shrink-0" />
      <Input
        v-model="noteInput"
        placeholder="Item note (e.g. no sugar)"
        class="h-7 text-xs flex-1"
        @keydown.enter="applyNote"
        @keydown.escape="showNote = false"
        autofocus
      />
      <Button size="sm" class="h-7 text-xs px-2" @click="applyNote">Save</Button>
    </div>
  </div>
</template>
