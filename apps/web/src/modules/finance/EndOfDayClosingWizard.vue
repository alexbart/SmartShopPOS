<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  PiggyBank,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Receipt,
} from '@lucide/vue';
import { useCashDrawer } from './composables/useFinance.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';

const { session, isLoading, closeMutation } = useCashDrawer();

const currentStep = ref(1);
const countedCash = ref(0);

const totalSteps = 4;

function nextStep() {
  if (currentStep.value < totalSteps) currentStep.value++;
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--;
}

async function handleSubmit() {
  if (!session.value?.id) return;
  await closeMutation.mutateAsync(countedCash.value);
  currentStep.value = totalSteps + 1;
}

const variance = computed(() => {
  if (!session.value) return 0;
  return Number(countedCash.value) - Number(session.value.expectedCash ?? 0);
});

const varianceStatus = computed(() => {
  const v = variance.value;
  if (Math.abs(v) < 0.01) return 'matched';
  return v > 0 ? 'overage' : 'shortage';
});

const stepLabels = ['Count Cash', 'Compare', 'Variance', 'Submit'];

const stepIcons = [PiggyBank, CreditCard, AlertCircle, CheckCircle];

const expectedFields = computed(() => [
  { label: 'Opening Float', amount: session.value?.openingFloat ?? 0 },
  { label: 'Cash Sales', amount: session.value?.totalSales ?? 0, color: 'text-success' },
  { label: 'Refunds', amount: session.value?.totalRefunds ?? 0 },
  { label: 'Expenses Paid', amount: 0 },
  { label: 'Cash In', amount: session.value?.totalCashIn ?? 0, color: 'text-success' },
  { label: 'Cash Out', amount: session.value?.totalCashOut ?? 0, color: 'text-destructive' },
  { label: 'Deposits', amount: 0 },
]);
</script>

<template>
  <WorkspaceShell
    workspace-title="End of Day Closing"
    workspace-description="Step-by-step cash drawer reconciliation"
  >
    <div class="space-y-6">
      <div v-if="isLoading" class="space-y-6">
        <div class="h-8 bg-muted/30 rounded animate-pulse w-48"></div>
        <div class="h-64 bg-muted/30 rounded animate-pulse"></div>
      </div>

      <div v-else-if="!session || session.status !== 'OPEN'" class="card p-8 text-center">
        <PiggyBank class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 class="text-xl font-bold mb-2">No Open Drawer</h2>
        <p class="text-muted-foreground mb-4">
          You need an open cash drawer to perform end-of-day closing.
        </p>
        <button
          @click="$router.push('/cash-drawer')"
          class="btn btn-primary touch-target"
        >
          Go to Cash Drawer
        </button>
      </div>

      <div v-else-if="currentStep > totalSteps" class="card p-8 text-center">
        <CheckCircle class="w-12 h-12 mx-auto mb-4 text-success" />
        <h2 class="text-xl font-bold mb-2">End of Day Complete</h2>
        <p class="text-muted-foreground mb-4">
          Your cash drawer has been closed and submitted for manager review.
        </p>
        <button
          @click="currentStep = 1; countedCash = 0"
          class="btn btn-outline touch-target"
        >
          Start New Close
        </button>
      </div>

      <template v-else>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium">End of Day Closing</h2>
          <div class="text-sm text-muted-foreground">
            Step {{ currentStep }} of {{ totalSteps }}
          </div>
        </div>

        <div class="flex items-center gap-2 mb-6">
          <div
            v-for="(label, i) in stepLabels"
            :key="label"
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium',
              currentStep === i + 1
                ? 'bg-primary text-primary-foreground'
                : currentStep > i + 1
                  ? 'bg-success/10 text-success'
                  : 'bg-muted/30 text-muted-foreground',
            ]"
          >
            {{ label }}
          </div>
          <div
            v-for="(_, i) in stepLabels"
            :key="`sep-${i}`"
            v-if="i < stepLabels.length - 1"
            class="flex-1 h-px bg-border"
          ></div>
        </div>

        <div class="card p-6">
          <template v-if="currentStep === 1">
            <div class="space-y-4">
              <h3 class="font-medium text-lg">Step 1: Count Cash</h3>
              <p class="text-sm text-muted-foreground">
                Count the physical cash in your drawer.
              </p>

              <div class="space-y-2">
                <label class="block text-sm font-medium">Counted Cash</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">KES</span>
                  <input
                    v-model.number="countedCash"
                    type="number"
                    class="input pl-10 w-full text-2xl font-bold"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div class="bg-muted/20 p-3 rounded">
                <div class="flex justify-between text-sm">
                  <span>Expected Cash</span>
                  <MoneyDisplay :amount="session.expectedCash ?? 0" />
                </div>
              </div>

              <div class="flex justify-between pt-4">
                <button @click="prevStep" class="btn btn-outline touch-target">
                  <ArrowLeft class="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  @click="nextStep"
                  :disabled="countedCash <= 0"
                  class="btn btn-primary touch-target"
                >
                  Next
                  <ArrowRight class="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="currentStep === 2">
            <div class="space-y-4">
              <h3 class="font-medium text-lg">Step 2: Compare</h3>
              <p class="text-sm text-muted-foreground">
                Compare counted cash vs expected cash.
              </p>

              <div class="grid grid-cols-2 gap-4">
                <div class="card p-4 text-center">
                  <p class="text-sm text-muted-foreground">Counted</p>
                  <p class="text-2xl font-bold mt-1">
                    <MoneyDisplay :amount="countedCash" />
                  </p>
                </div>
                <div class="card p-4 text-center">
                  <p class="text-sm text-muted-foreground">Expected</p>
                  <p class="text-2xl font-bold mt-1 text-primary">
                    <MoneyDisplay :amount="session.expectedCash ?? 0" />
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <h4 class="text-sm font-medium">Expected Breakdown</h4>
                <div
                  v-for="field in expectedFields"
                  :key="field.label"
                  class="flex justify-between text-sm"
                >
                  <span class="text-muted-foreground">{{ field.label }}</span>
                  <span :class="field.color || ''">
                    <MoneyDisplay :amount="field.amount" />
                  </span>
                </div>
              </div>

              <div class="flex justify-between pt-4">
                <button @click="prevStep" class="btn btn-outline touch-target">
                  <ArrowLeft class="w-4 h-4 mr-2" />
                  Back
                </button>
                <button @click="nextStep" class="btn btn-primary touch-target">
                  Next
                  <ArrowRight class="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="currentStep === 3">
            <div class="space-y-4">
              <h3 class="font-medium text-lg">Step 3: Variance</h3>
              <p class="text-sm text-muted-foreground">
                Review the variance before submitting.
              </p>

              <div
                class="card p-4 text-center"
                :class="
                  varianceStatus === 'matched'
                    ? 'bg-success/5'
                    : 'bg-warning/5 border border-warning/20'
                "
              >
                <div class="flex items-center justify-center gap-2 mb-2">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    :class="
                      varianceStatus === 'matched'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    "
                  >
                    <AlertCircle class="w-4 h-4" v-if="varianceStatus !== 'matched'" />
                    <CheckCircle class="w-4 h-4" v-else />
                  </div>
                  <span class="font-bold">
                    {{
                      varianceStatus === 'matched'
                        ? 'No Variance'
                        : varianceStatus === 'overage'
                          ? 'Cash Overage'
                          : 'Cash Shortage'
                    }}
                  </span>
                </div>
                <p class="text-2xl font-bold">
                  <MoneyDisplay :amount="variance" />
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{
                    varianceStatus === 'matched'
                      ? 'Drawer balances perfectly'
                      : 'Please verify before submitting'
                  }}
                </p>
              </div>

              <div
                v-if="varianceStatus !== 'matched'"
                class="bg-warning/5 border border-warning/20 rounded p-3"
              >
                <div class="flex items-start gap-2">
                  <AlertCircle class="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p class="text-sm font-medium text-warning">Variance Detected</p>
                    <p class="text-xs text-muted-foreground">
                      Please confirm the amount is correct before closing.
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex justify-between pt-4">
                <button @click="prevStep" class="btn btn-outline touch-target">
                  <ArrowLeft class="w-4 h-4 mr-2" />
                  Back
                </button>
                <button @click="nextStep" class="btn btn-primary touch-target">
                  Next
                  <ArrowRight class="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="currentStep === 4">
            <div class="space-y-4">
              <h3 class="font-medium text-lg">Step 4: Submit</h3>
              <p class="text-sm text-muted-foreground">
                Review and submit for manager review.
              </p>

              <div class="card p-4 space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Drawer ID</span>
                  <span class="font-medium">{{ session.id.slice(0, 8) }}...</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Expected Cash</span>
                  <MoneyDisplay :amount="session.expectedCash ?? 0" />
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Counted Cash</span>
                  <MoneyDisplay :amount="countedCash" />
                </div>
                <div class="border-t pt-3 flex justify-between font-medium">
                  <span>Variance</span>
                  <span :class="varianceStatus === 'matched' ? 'text-success' : 'text-warning'">
                    <MoneyDisplay :amount="variance" />
                  </span>
                </div>
              </div>

              <div
                v-if="varianceStatus !== 'matched'"
                class="bg-warning/5 border border-warning/20 rounded p-3"
              >
                <div class="flex items-start gap-2">
                  <AlertCircle class="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p class="text-sm font-medium">Manager approval required</p>
                    <p class="text-xs text-muted-foreground">
                      Variance detected — this will be flagged for manager review.
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex justify-between pt-4">
                <button @click="prevStep" class="btn btn-outline touch-target">
                  <ArrowLeft class="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  @click="handleSubmit"
                  :disabled="closeMutation.isPending || countedCash <= 0"
                  class="btn btn-primary touch-target"
                >
                  {{ closeMutation.isPending ? 'Submitting...' : 'Submit for Review' }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </WorkspaceShell>
</template>
