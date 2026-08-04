<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight } from '@lucide/vue';
import { PurchaseOrderStatusLabels, PurchaseOrderStatusSteps } from '../composables/usePurchaseOrders.js';

interface TimelineStep {
  id: string;
  label: string;
  status: string;
  date?: string;
  performedBy?: string;
}

interface Props {
  currentStatus: string;
  steps?: TimelineStep[];
  createdAt: string;
  updatedAt: string;
}

const props = withDefaults(defineProps<Props>(), {
  steps: () => [],
});

const steps = computed(() => {
  const allSteps: TimelineStep[] = props.steps.length > 0
    ? props.steps
    : [
        { id: 'created', label: 'Draft', status: 'DRAFT', date: props.createdAt },
        { id: 'submitted', label: 'Submitted', status: 'SUBMITTED', date: props.updatedAt },
        { id: 'approved', label: 'Approved', status: 'APPROVED' },
        { id: 'received', label: 'Received', status: 'RECEIVED', date: props.updatedAt },
      ];
  return allSteps;
});

const currentStepIndex = computed(() =>
  PurchaseOrderStatusSteps.indexOf(props.currentStatus as any)
);
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-sm font-medium text-muted-foreground mb-4">Purchase Order Progress</h3>

    <div class="relative">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="relative flex items-start"
      >
        <div class="absolute left-4 -ml-px h-full w-0.5" :class="{
          'bg-primary': index <= currentStepIndex,
          'bg-muted': index > currentStepIndex
        }"></div>

        <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2" :class="{
          'bg-primary border-primary text-primary-foreground': index < currentStepIndex,
          'bg-primary border-primary text-primary-foreground': index === currentStepIndex,
          'bg-background border-muted text-muted-foreground': index > currentStepIndex,
        }">
          <ChevronRight
            v-if="index < currentStepIndex"
            class="w-4 h-4"
          />
          <div
            v-else-if="index === currentStepIndex"
            class="w-2 h-2 rounded-full bg-current"
          ></div>
          <div
            v-else
            class="w-2 h-2 rounded-full bg-current"
          ></div>
        </div>

        <div class="ml-4 pb-6">
          <div class="flex items-baseline justify-between">
            <p :class="[
              'text-sm font-medium',
              index <= currentStepIndex ? 'text-card-foreground' : 'text-muted-foreground',
            ]">
              {{ step.label }}
            </p>
            <div
              v-if="step.date"
              class="text-xs text-muted-foreground"
            >
              {{ new Date(step.date).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
            </div>
          </div>
          <p v-if="step.performedBy" class="text-xs text-muted-foreground">
            by {{ step.performedBy }}
          </p>
          <p v-else class="text-xs text-muted-foreground">
            {{ PurchaseOrderStatusLabels[step.status] || step.status }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
