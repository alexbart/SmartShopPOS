<script setup lang="ts">
import { ref, watch } from 'vue';
import { UploadCloud, X, GripVertical } from '@lucide/vue';

const props = defineProps<{
  modelValue: string[];
  max?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string[]): void;
  (e: 'add', files: File[]): void;
  (e: 'remove', index: number): void;
  (e: 'reorder', files: string[]): void;
}>();

const dragOver = ref(false);

watch(
  () => props.modelValue,
  (v) => {
    emit('update:modelValue', v);
  },
);

function handleDrop(e: DragEvent) {
  e.preventDefault();
  dragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (files.length > 0) {
      emit('add', files.slice(0, props.max ?? 10));
    }
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const files = Array.from(input.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    emit('add', files.slice(0, props.max ?? 10));
  }
  input.value = '';
}

function removeImage(index: number) {
  emit('remove', index);
}
</script>

<template>
  <div
    class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
    :class="
      dragOver
        ? 'border-primary bg-primary/5'
        : 'border-border hover:border-primary'
    "
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop="handleDrop"
  >
    <UploadCloud class="w-8 h-8 text-muted-foreground mx-auto mb-2" />
    <p class="text-sm text-muted-foreground">
      Drag & drop images here, or click to upload
    </p>
    <p class="text-xs text-muted-foreground/50 mt-1">
      Up to {{ max ?? 10 }} images (PNG, JPG, GIF)
    </p>
    <input
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="handleFileSelect"
      ref="fileInput"
    />
  </div>

  <div
    v-if="modelValue.length > 0"
    class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4"
  >
    <div
      v-for="(img, index) in modelValue"
      :key="index"
      class="relative aspect-square rounded-md overflow-hidden border group"
    >
      <img :src="img" :alt="`product-image-${index}`" class="w-full h-full object-cover" />
      <div
        class="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          @click="removeImage(index)"
          class="p-1 rounded hover:bg-muted/30 text-white"
          title="Remove"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
      <GripVertical class="absolute top-1 left-1 w-3 h-3 text-white/50 cursor-move" />
    </div>
  </div>
</template>
