<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search, X, ScanLine } from '@lucide/vue';
import { Input } from '@/components/ui/input';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    showBarcode?: boolean;
    debounce?: number;
  }>(),
  {
    placeholder: 'Search products, SKU, barcode...',
    showBarcode: true,
    debounce: 200,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'search', v: string): void;
  (e: 'barcode', v: string): void;
  (e: 'clear'): void;
}>();

const localValue = ref(props.modelValue);
const inputRef = ref<HTMLInputElement | null>(null);
const isComposing = ref(false);
const scanBuffer = ref('');
const lastScanTime = ref(0);

watch(
  () => props.modelValue,
  (v) => {
    if (isComposing.value) return;
    localValue.value = v;
  },
);

watch(localValue, (v) => {
  emit('update:modelValue', v);

  if (!isComposing.value) {
    const now = Date.now();
    if (now - lastScanTime.value > props.debounce) {
      emit('search', v);
    } else {
      const handler = setTimeout(() => emit('search', v), props.debounce);
      return () => clearTimeout(handler);
    }
  }
});

function handleCompositionStart() {
  isComposing.value = true;
}

function handleCompositionEnd() {
  isComposing.value = false;
  emit('search', localValue.value);
}

function handleKeydown(e: KeyboardEvent) {
  const now = Date.now();
  const timeSinceLast = now - lastScanTime.value;

  if (timeSinceLast < 100 && e.key.length === 1 && !isComposing.value) {
    scanBuffer.value += e.key;
    lastScanTime.value = now;

    if (scanBuffer.value.length >= 4 && /^[0-9]+$/.test(scanBuffer.value)) {
      emit('barcode', scanBuffer.value);
      localValue.value = '';
      scanBuffer.value = '';
    }
  } else {
    scanBuffer.value = '';
  }

  if (e.key === 'Enter' && localValue.value && !isComposing.value) {
    emit('search', localValue.value);
  }

  if (e.key === 'Escape') {
    emit('clear');
  }
}

function clear() {
  localValue.value = '';
  emit('update:modelValue', '');
  emit('search', '');
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div class="relative flex-1 min-w-[200px]">
    <Search
      v-if="!showBarcode"
      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
    />
    <ScanLine
      v-else
      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
    />
    <Input
      ref="inputRef"
      :value="localValue"
      @input="localValue = ($event.target as HTMLInputElement).value"
      @keydown="handleKeydown"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      :placeholder="placeholder"
      class="pl-10 pr-8 h-10 text-base touch-target"
      inputmode="search"
      autocomplete="off"
    />
    <button
      v-if="localValue"
      @click="clear"
      class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="Clear search"
    >
      <X class="w-3 h-3" />
    </button>
  </div>
</template>
