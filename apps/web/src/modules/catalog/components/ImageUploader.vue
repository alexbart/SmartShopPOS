<script setup lang="ts">
import { ref, computed } from 'vue';
import { Upload, X, Image as ImageIcon } from '@lucide/vue';
import { notification } from '@/stores/notification';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  alt?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: File[];
    maxFiles?: number;
  }>(),
  { modelValue: () => [], maxFiles: 10 },
);

const emit = defineEmits<{
  (e: 'update:modelValue', files: File[]): void;
  (e: 'upload', files: File[]): void;
}>();

const files = ref<ImageFile[]>(
  props.modelValue.map((f) => ({
    id: Math.random().toString(36).slice(2),
    file: f,
    preview: URL.createObjectURL(f),
  })),
);
const dragOver = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const canAddMore = computed(() => files.value.length < props.maxFiles);

function handleDrop(e: DragEvent) {
  e.preventDefault();
  dragOver.value = false;
  const dropped = Array.from(e.dataTransfer?.files ?? []).filter(
    (f) => f.type.startsWith('image/'),
  );
  if (dropped.length === 0) return;
  addFiles(dropped.slice(0, props.maxFiles - files.value.length));
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const selected = Array.from(input.files ?? []).filter((f) =>
    f.type.startsWith('image/'),
  );
  if (selected.length === 0) return;
  addFiles(selected.slice(0, props.maxFiles - files.value.length));
  input.value = '';
}

function addFiles(newFiles: File[]) {
  const newImageFiles: ImageFile[] = newFiles.map((f) => ({
    id: Math.random().toString(36).slice(2),
    file: f,
    preview: URL.createObjectURL(f),
  }));
  files.value = [...files.value, ...newImageFiles];
  updateModel();
  if (newImageFiles.length > 0) {
    emit('upload', newImageFiles.map((f) => f.file));
  }
}

function removeFile(id: string) {
  const removed = files.value.find((f) => f.id === id);
  if (removed) {
    URL.revokeObjectURL(removed.preview);
  }
  files.value = files.value.filter((f) => f.id !== id);
  updateModel();
  notification.success('Image removed');
}

function updateModel() {
  emit('update:modelValue', files.value.map((f) => f.file));
}
</script>

<template>
  <div
    class="border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors"
    :class="{
      'border-primary bg-primary/5': dragOver,
      'opacity-50': !canAddMore,
    }"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />

    <div
      v-if="files.length === 0"
      class="flex flex-col items-center justify-center py-8"
    >
      <Upload class="w-12 h-12 text-muted-foreground/50 mb-3" />
      <p class="text-sm text-muted-foreground mb-1">
        Drag and drop images here
      </p>
      <p class="text-xs text-muted-foreground/70 mb-3">
        or
      </p>
      <button
        @click="fileInputRef?.click()"
        class="btn btn-outline btn-sm touch-target"
        :disabled="!canAddMore"
      >
        <ImageIcon class="w-4 h-4 mr-2" />
        Browse
      </button>
      <p class="text-xs text-muted-foreground/50 mt-2">
        Up to {{ maxFiles }} images (PNG, JPG, GIF)
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
    >
      <div
        v-for="file in files"
        :key="file.id"
        class="relative group"
      >
        <div class="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
          <img
            :src="file.preview"
            :alt="file.alt || 'Product image'"
            class="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>

        <div
          class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical class="w-4 h-4 text-white cursor-move" />
        </div>

        <button
          @click="removeFile(file.id)"
          class="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-target"
          title="Remove image"
        >
          <X class="w-3 h-3" />
        </button>
      </div>

      <div
        v-if="canAddMore"
        class="aspect-square rounded-lg border border-dashed border-border flex items-center justify-center hover:border-primary transition-colors cursor-pointer"
        @click="fileInputRef?.click()"
      >
        <Upload class="w-6 h-6 text-muted-foreground" />
      </div>
    </div>
  </div>
</template>
