<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  Minus,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
} from '@lucide/vue';
import { useCashDrawer } from './composables/useFinance.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';
import StatusBadge from '@/components/business/StatusBadge.vue';

const router = useRouter();

const { session, movements, isLoading, openMutation, closeMutation, cashInMutation } = useCashDrawer();

const openingFloat = ref(0);
const cashInAmount = ref(0);
const cashInNotes = ref('');
const cashOutAmount = ref(0);
const cashOutNotes = ref('');
const countedCash = ref(0);

const showCashIn = ref(false);
const showCashOut = ref(false);
const showCloseConfirm = ref(false);

const isOpening = computed(() => openMutation.isPending.value);
const isClosing = computed(() => closeMutation.isPending.value);

async function handleOpenDrawer() {
  if (openingFloat.value <= 0) return;
  await openMutation.mutateAsync(openingFloat.value);
}

async function handleCashIn() {
  if (cashInAmount.value <= 0) return;
  await cashInMutation.mutateAsync({ amount: cashInAmount.value, notes: cashInNotes.value });
  showCashIn.value = false;
  cashInAmount.value = 0;
  cashInNotes.value = '';
}

async function handleCashOut() {
  if (cashOutAmount.value <= 0) return;
  await cashInMutation.mutateAsync({ amount: -cashOutAmount.value, notes: cashOutNotes.value });
  showCashOut.value = false;
  cashOutAmount.value = 0;
  cashOutNotes.value = '';
}

async function handleCloseDrawer() {
  if (!session.value?.id) return;
  await closeMutation.mutateAsync(countedCash.value);
  showCloseConfirm.value = false;
}

const drawerFlowSteps = [
  { key: 'open', label: 'Open Drawer', icon: Wallet, status: 'complete' },
  { key: 'sales', label: 'Sales Active', icon: TrendingUp, status: 'active' },
  { key: 'count', label: 'Cash Count', icon: CreditCard, status: 'pending' },
  { key: 'variance', label: 'Variance Check', icon: AlertTriangle, status: 'pending' },
  { key: 'close', label: 'Close Drawer', icon: CheckCircle, status: 'pending' },
];

const flowSteps = computed(() => {
  if (!session.value) {
    return [
      { label: 'Open Drawer', icon: Wallet, status: 'active' },
      { label: 'Sales Active', icon: TrendingUp, status: 'pending' },
      { label: 'Cash Count', icon: CreditCard, status: 'pending' },
      { label: 'Variance Check', icon: AlertTriangle, status: 'pending' },
      { label: 'Close Drawer', icon: CheckCircle, status: 'pending' },
    ];
  }
  if (session.value.status === 'OPEN') {
    return [
      { label: 'Open Drawer', icon: Wallet, status: 'complete' },
      { label: 'Sales Active', icon: TrendingUp, status: 'active' },
      { label: 'Cash Count', icon: CreditCard, status: 'pending' },
      { label: 'Variance Check', icon: AlertTriangle, status: 'pending' },
      { label: 'Close Drawer', icon: CheckCircle, status: 'pending' },
    ];
  }
  return drawerFlowSteps;
});

const timelineEvents = computed(() => {
  const events = [];
  if (session.value) {
    if (session.value.openedAt) {
      events.push({
        time: session.value.openedAt,
        label: 'Opened',
        amount: session.value.openingFloat,
        icon: Wallet,
        status: 'success',
      });
    }
    for (const m of movements.value || []) {
      events.push({
        time: m.createdAt,
        label: m.type.replace(/_/g, ' '),
        amount: m.amount,
        icon: m.type.includes('IN') || m.type.includes('sales') ? Plus : m.type.includes('DEPOSIT') ? CreditCard : Minus,
        status: 'info',
        notes: m.notes,
      });
    }
    if (session.value.closedAt) {
      events.push({
        time: session.value.closedAt,
        label: 'Closed',
        amount: session.value.closingFloat ?? session.value.countedCash ?? 0,
        icon: CheckCircle,
        status: session.value.variance && Math.abs(session.value.variance) > 0.01 ? 'warning' : 'success',
        variance: session.value.variance,
      });
    }
  }
  return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
});

function getMovementAmountClass(amount: number): string {
  return Number(amount) > 0 ? 'text-success' : 'text-destructive';
}

function getMovementBgClass(amount: number): string {
  return Number(amount) > 0 ? 'bg-success/10' : 'bg-destructive/10';
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function getMovementTypeLabel(type: string) {
  const labels: Record<string, string> = {
    CASH_IN: 'Cash In',
    CASH_OUT: 'Cash Out',
    SALE: 'Sale',
    REFUND: 'Refund',
    EXPENSE: 'Expense Payment',
    DEPOSIT: 'Deposit',
  };
  return labels[type] ?? type.replace(/_/g, ' ');
}

function getMovementTypeIcon(type: string) {
  const positive = ['SALE', 'CASH_IN', 'DEPOSIT'];
  const negative = ['REFUND', 'CASH_OUT', 'EXPENSE'];
  if (positive.some(t => type.includes(t))) return Plus;
  if (negative.some(t => type.includes(t))) return Minus;
  return Clock;
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Cash Drawer"
    workspace-description="Shift management for cash operations"
  >
    <div class="space-y-6">
      <div v-if="isLoading" class="space-y-6">
        <div class="h-12 bg-muted/30 rounded animate-pulse w-full"></div>
        <div class="h-64 bg-muted/30 rounded animate-pulse w-full"></div>
      </div>

      <div v-else-if="!session" class="max-w-md mx-auto">
        <div class="card p-6 text-center">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wallet class="w-6 h-6 text-primary" />
          </div>
          <h2 class="text-lg font-bold mb-2">Open Cash Drawer</h2>
          <p class="text-sm text-muted-foreground mb-4">Start a new cash drawer shift</p>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Opening Float</label>
            <input
              v-model.number="openingFloat"
              type="number"
              placeholder="Enter opening amount"
              class="input w-full"
              min="0"
            />
          </div>

          <button
            @click="handleOpenDrawer"
            :disabled="isOpening || openingFloat <= 0"
            class="btn btn-primary w-full touch-target"
          >
            <span v-if="isOpening">Opening...</span>
            <span v-else>Open Drawer</span>
          </button>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="px-2 py-1 rounded-full text-xs font-medium"
              :class="
                session.status === 'OPEN'
                  ? 'bg-success/10 text-success'
                  : 'bg-muted/30 text-muted-foreground'
              "
            >
              {{ session.status }}
            </div>
            <span class="text-sm text-muted-foreground">
              Opened {{ new Date(session.openedAt).toLocaleString('en-KE') }}
            </span>
          </div>
          <div class="flex gap-2">
            <button
              v-if="session.status === 'OPEN'"
              @click="showCashIn = true"
              class="btn btn-outline btn-sm touch-target"
            >
              <Plus class="w-3 h-3 mr-1" /> Cash In
            </button>
            <button
              v-if="session.status === 'OPEN'"
              @click="showCashOut = true"
              class="btn btn-outline btn-sm touch-target"
            >
              <Minus class="w-3 h-3 mr-1" /> Cash Out
            </button>
            <button
              v-if="session.status === 'OPEN'"
              @click="showCloseConfirm = true"
              class="btn btn-outline btn-sm touch-target"
            >
              <CreditCard class="w-3 h-3 mr-1" /> Close
            </button>
          </div>
        </div>

        <div class="card p-4">
          <h3 class="font-medium mb-3">Drawer Workflow</h3>
          <div class="flex items-center justify-between">
            <div
              v-for="(step, i) in flowSteps"
              :key="step.label"
              class="flex flex-col items-center"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                :class="{
                  'bg-success/10 text-success': step.status === 'complete',
                  'bg-primary/10 text-primary': step.status === 'active',
                  'bg-muted/30 text-muted-foreground': step.status === 'pending',
                }"
              >
                <component :is="step.icon" class="w-4 h-4" />
              </div>
              <span class="text-xs text-center text-muted-foreground">{{ step.label }}</span>
            </div>
            <div v-if="session.status === 'OPEN'" class="flex-1 h-px bg-border"></div>
            <div v-if="session.status === 'OPEN'" class="flex items-center text-xs text-muted-foreground">
              Variance:
              <span
                :class="Number(session.variance ?? 0) === 0 ? 'text-success' : 'text-warning'"
                class="font-medium ml-1"
              >
                <MoneyDisplay :amount="session.variance ?? 0" />
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-4">
            <h3 class="font-medium mb-3">Cash Movements</h3>
            <div class="space-y-2">
              <div
                v-for="movement in movements"
                :key="movement.id"
                class="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div class="flex items-center gap-3">
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center"
                  :class="getMovementBgClass(movement.amount)"
                >
                    <component :is="getMovementTypeIcon(movement.type)" class="w-3 h-3" />
                  </div>
                  <div>
                    <p class="font-medium text-sm">
                      {{ getMovementTypeLabel(movement.type) }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ formatTime(movement.createdAt) }}
                      <span v-if="movement.performedBy">· {{ movement.performedBy }}</span>
                    </p>
                  </div>
                </div>
    <div class="text-right">
      <p
        class="font-medium text-sm"
        :class="getMovementAmountClass(movement.amount)"
      >
        {{ Number(movement.amount) > 0 ? '+' : '' }}
        <MoneyDisplay :amount="movement.amount" />
      </p>
    </div>
              </div>

              <div
                v-if="!movements || movements.length === 0"
                class="text-center py-4 text-muted-foreground text-sm"
              >
                No movements recorded yet.
              </div>
            </div>
          </div>

          <div class="card p-4 space-y-4">
            <h3 class="font-medium">Drawer Summary</h3>

            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Opening Float</span>
                <MoneyDisplay :amount="session.openingFloat ?? 0" />
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Cash Sales</span>
                <MoneyDisplay :amount="session.totalSales ?? 0" class="text-success" />
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Refunds</span>
                <MoneyDisplay :amount="session.totalRefunds ?? 0" />
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Cash In</span>
                <MoneyDisplay :amount="session.totalCashIn ?? 0" />
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Cash Out</span>
                <MoneyDisplay :amount="session.totalCashOut ?? 0" />
              </div>
              <div class="border-t pt-3 flex justify-between font-medium">
                <span>Expected Cash</span>
                <MoneyDisplay :amount="session.expectedCash ?? 0" />
              </div>

              <div v-if="session.countedCash !== null && session.countedCash !== undefined" class="border-t pt-3">
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Counted Cash</span>
                  <MoneyDisplay :amount="session.countedCash ?? 0" />
                </div>
              </div>

              <div
                v-if="session.variance !== null && session.variance !== undefined && Number(session.variance) !== 0"
                class="p-3 rounded-lg bg-warning/10 border border-warning/30"
              >
                <div class="flex items-center gap-2">
                  <AlertTriangle class="w-4 h-4 text-warning" />
                  <span class="font-medium text-warning">Variance Detected</span>
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                  Expected
                  <MoneyDisplay :amount="session.expectedCash ?? 0" size="sm" />
                  vs Counted
                  <MoneyDisplay :amount="session.countedCash ?? 0" size="sm" />
                </p>
                <p class="font-bold mt-1">
                  <MoneyDisplay :amount="session.variance ?? 0" />
                </p>
              </div>
            </div>

            <button
              v-if="session.status === 'OPEN'"
              @click="showCloseConfirm = true"
              class="w-full btn btn-primary touch-target"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>

  <teleport to="body">
    <div
      v-if="showCashIn"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="card p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Cash In</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Amount</label>
            <input v-model.number="cashInAmount" type="number" class="input w-full" placeholder="KES 0.00" min="0" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Notes</label>
            <input v-model="cashInNotes" type="text" class="input w-full" placeholder="Optional" />
          </div>
          <div class="flex gap-2">
            <button @click="showCashIn = false" class="btn btn-outline flex-1">Cancel</button>
            <button @click="handleCashIn" :disabled="cashInAmount <= 0" class="btn btn-primary flex-1">
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <teleport to="body">
    <div
      v-if="showCashOut"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="card p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Cash Out</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Amount</label>
            <input v-model.number="cashOutAmount" type="number" class="input w-full" placeholder="KES 0.00" min="0" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Notes</label>
            <input v-model="cashOutNotes" type="text" class="input w-full" placeholder="Optional" />
          </div>
          <div class="flex gap-2">
            <button @click="showCashOut = false" class="btn btn-outline flex-1">Cancel</button>
            <button @click="handleCashOut" :disabled="cashOutAmount <= 0" class="btn btn-primary flex-1">
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <teleport to="body">
    <div
      v-if="showCloseConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="card p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Close Cash Drawer</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Enter the counted cash amount to reconcile.
        </p>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Counted Cash</label>
          <input v-model.number="countedCash" type="number" class="input w-full" min="0" />
        </div>

        <div v-if="session" class="bg-muted/20 p-3 rounded mb-4">
          <div class="flex justify-between text-sm">
            <span>Expected Cash</span>
            <MoneyDisplay :amount="session.expectedCash ?? 0" />
          </div>
          <div v-if="Number(countedCash) > 0 && Number(session.expectedCash) !== Number(countedCash)" class="flex justify-between text-sm mt-2">
            <span class="text-warning">Variance</span>
            <span class="text-warning">
              <MoneyDisplay :amount="Number(countedCash) - Number(session.expectedCash ?? 0)" />
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="showCloseConfirm = false" class="btn btn-outline flex-1">Cancel</button>
          <button
            @click="handleCloseDrawer"
            :disabled="isClosing || countedCash <= 0"
            class="btn btn-primary flex-1"
          >
            {{ isClosing ? 'Closing...' : 'Close Drawer' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
