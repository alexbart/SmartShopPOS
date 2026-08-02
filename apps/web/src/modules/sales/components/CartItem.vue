<script setup lang="ts">
import { ref } from 'vue';
import type { PosCartItem } from '@/modules/sales/composables/types';
import ProductAvatar from '@/modules/catalog/components/ProductAvatar.vue';
import { Plus, Minus, Trash2, Tag, Edit2, Check } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const props = defineProps<{
  item: PosCartItem;
}>();

const emit = defineEmits<{
  (e: 'update-qty', id: string, qty: number): void;
  (e: 'remove', id: string): void;
  (e: 'discount', id: string, amount: number): void;
  (e: 'note', id: string, note: string): void;
}>();

const editingDiscount = ref(false);
const discountInput = ref('');
const editingNote = ref(false);
const noteInput = ref('');

function handleQtyChange(delta: number) {
  emit('update-qty', props.item.id, props.item.quantity + delta);
}

function handleDiscountApply() {
  const amount = parseFloat(discountInput.value) || 0;
  emit('discount', props.item.id, amount);
  editingDiscount.value = false;
  discountInput.value = '';
}

function handleNoteApply() {
  emit('note', props.item.id, noteInput.value);
  editingNote.value = false;
}
</script>

<template>
  <div class="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
    <ProductAvatar
      :src="item.product.imageUrl"
      :alt="item.product.name"
      size="sm"
    />

    <div class="flex-1 min-w-0">
      <p class="font-medium text-sm truncate">{{ item.product.name }}</p>
      <p class="text-xs text-muted-foreground/70 font-mono">
        {{ item.product.code || item.product.sku || '—' }}
      </p>
    </div>

    <div class="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        class="h-6 w-6 touch-target"
        @click="handleQtyChange(-1)"
      >
        <Minus class="w-3 h-3" />
      </Button>
      <span class="text-sm font-medium w-6 text-center">{{ item.quantity }}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        class="h-6 w-6 touch-target"
        @click="handleQtyChange(1)"
      >
        <Plus class="w-3 h-3" />
      </Button>
    </div>

    <div class="text-right w-20">
      <p class="text-sm font-medium">
        KES {{ (item.price * item.quantity).toLocaleString() }}
      </p>
      <p
        v-if="item.discount > 0"
        class="text-xs text-green-600"
      >
        -{{ item.discount }} discount
      </p>
    </div>

    <div class="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon-sm"
              class="h-6 w-6 touch-target"
              @click="editingDiscount = true; discountInput = String(item.discount)"
            >
              <Tag class="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            Add discount
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon-sm"
              class="h-6 w-6 touch-target"
              @click="editingNote = true; noteInput = item.note"
            >
              <Edit2 class="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            Add note
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon-sm"
              class="h-6 w-6 text-red-500 hover:text-red-700 touch-target"
              @click.stop="$emit('remove', item.id)"
            >
              <Trash2 class="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            Remove item
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <div
      v-if="editingDiscount"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      @click="editingDiscount = false"
    >
      <div
        class="bg-popover border border-border rounded-lg p-4 w-48"
        @click.stop
      >
        <h4 class="text-sm font-medium mb-2">Item Discount</h4>
        <Input
          v-model="discountInput"
          type="number"
          placeholder="0"
          class="h-8"
        />
        <div class="flex justify-end gap-2 mt-3">
          <Button variant="ghost" size="sm" @click="editingDiscount = false">
            Cancel
          </Button>
          <Button size="sm" @click="handleDiscountApply">
            <Check class="w-4 h-4 mr-1" />
            Apply
          </Button>
        </div>
      </div>
    </div>

    <div
      v-if="editingNote"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      @click="editingNote = false"
    >
      <div
        class="bg-popover border border-border rounded-lg p-4 w-48"
        @click.stop
      >
        <h4 class="text-sm font-medium mb-2">Item Note</h4>
        <Input
          v-model="noteInput"
          placeholder="e.g. No sugar..."
          class="h-8"
        />
        <div class="flex justify-end gap-2 mt-3">
          <Button variant="ghost" size="sm" @click="editingNote = false">
            Cancel
          </Button>
          <Button size="sm" @click="handleNoteApply">
            <Check class="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
