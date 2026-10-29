<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Tag,
  Layers,
  Package,
  CheckCircle,
  PauseCircle,
  Archive,
  FileText,
} from '@lucide/vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  open: boolean;
  selectedCount: number;
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
  taxes?: { id: string; name: string; rate: number }[];
  units?: { id: string; name: string; abbreviation: string }[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'apply', payload: Record<string, unknown>): void;
}>();

const step = ref(1);
const selectedAction = ref<string | null>(null);
const selectedValue = ref<string | null>(null);

const actions = [
  { value: 'category', label: 'Change Category', icon: Tag, color: 'text-blue-600' },
  { value: 'brand', label: 'Change Brand', icon: Layers, color: 'text-purple-600' },
  { value: 'tax', label: 'Change Tax', icon: FileText, color: 'text-emerald-600' },
  { value: 'unit', label: 'Change Unit', icon: Package, color: 'text-amber-600' },
  { value: 'activate', label: 'Activate', icon: CheckCircle, color: 'text-green-600' },
  { value: 'deactivate', label: 'Deactivate', icon: PauseCircle, color: 'text-orange-600' },
  { value: 'archive', label: 'Archive', icon: Archive, color: 'text-gray-600' },
];

const actionOptions = computed(() => {
  const a = actions.find((x) => x.value === selectedAction.value);
  return a ? { label: a.label, icon: a.icon } : null;
});

function getOptions(): { value: string; label: string }[] {
  const action = selectedAction.value;
  if (action === 'category') return props.categories?.map((c) => ({ value: c.id, label: c.name })) ?? [];
  if (action === 'brand') return props.brands?.map((b) => ({ value: b.id, label: b.name })) ?? [];
  if (action === 'tax') return props.taxes?.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` })) ?? [];
  if (action === 'unit') return props.units?.map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` })) ?? [];
  return [];
}

function reset() {
  step.value = 1;
  selectedAction.value = null;
  selectedValue.value = null;
}

function next() {
  step.value++;
}

function prev() {
  step.value--;
}

function apply() {
  const payload: Record<string, unknown> = { action: selectedAction.value, count: props.selectedCount };
  if (selectedValue.value) {
    payload.value = selectedValue.value;
  }
  emit('apply', payload);
  reset();
}

function handleClose() {
  reset();
  emit('close');
}

const showValueSelect = computed(() =>
  ['category', 'brand', 'tax', 'unit'].includes(selectedAction.value ?? ''),
);

const saveMutationLoading = ref(false);
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Bulk Update Products</DialogTitle>
        <DialogDescription>
          Apply changes to {{ selectedCount }} selected product(s).
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <div v-if="step === 1">
          <h3 class="text-sm font-medium text-muted-foreground mb-3">
            Choose Action
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="action in actions"
              :key="action.value"
              @click="selectedAction = action.value"
              :class="[
                'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                selectedAction === action.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50',
              ]"
            >
              <component :is="action.icon" class="w-5 h-5" :class="action.color" />
              <span class="font-medium">{{ action.label }}</span>
            </button>
          </div>
        </div>

        <div v-if="step === 2">
          <h3 class="text-sm font-medium text-muted-foreground mb-3">
            Choose Value
          </h3>
          <div
            v-if="showValueSelect"
            class="space-y-2"
          >
            <Select v-model="selectedValue">
              <SelectTrigger class="touch-target">
                <SelectValue placeholder="Select a value..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in getOptions()"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            v-else
            class="p-4 bg-muted/30 rounded-lg"
          >
            <p class="text-sm">
              This will {{ actionOptions?.label.toLowerCase() }}
              {{ selectedCount }} product(s).
            </p>
            Are you sure you want to continue?
          </div>
        </div>

        <div v-if="step === 3">
          <h3 class="text-sm font-medium text-muted-foreground mb-3">
            Preview Changes
          </h3>
          <Card class="border border-border">
            <CardContent class="pt-4 space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Action</span>
                <span class="font-medium">
                  {{ actionOptions?.label }}
                </span>
              </div>
              <Separator />
              <div class="flex justify-between">
                <span class="text-muted-foreground">Products affected</span>
                <span class="font-medium">{{ selectedCount }}</span>
              </div>
              <div
                v-if="selectedValue"
                class="flex justify-between"
              >
                <span class="text-muted-foreground">New value</span>
                <span class="font-medium">
                  {{ getOptions().find((o) => o.value === selectedValue)?.label || selectedValue }}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      <div class="flex justify-between items-center">
        <Button
          v-if="step > 1"
          variant="ghost"
          size="sm"
          @click="prev"
        >
          <ChevronLeft class="w-4 h-4 mr-1" />
          Back
        </Button>
        <div class="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            @click="handleClose"
          >
            Cancel
          </Button>
          <Button
            v-if="step < 3"
            size="sm"
            :disabled="!selectedAction || (showValueSelect && !selectedValue)"
            @click="next"
          >
            Continue
            <ChevronRight class="w-4 h-4 ml-1" />
          </Button>
          <Button
            v-else
            size="sm"
            :disabled="saveMutationLoading"
            @click="apply"
          >
             <Save class="w-4 h-4 mr-1" v-if="!saveMutationLoading" />
            {{ saveMutationLoading ? 'Applying...' : 'Apply Changes' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
