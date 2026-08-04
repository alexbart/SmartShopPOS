<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Banknote,
  Plus,
  Building,
  Calendar,
  Check,
  Clock,
  AlertCircle,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  FileText,
} from '@lucide/vue';
import { useBanking } from './composables/useFinance.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';
import StatusBadge from '@/components/business/StatusBadge.vue';

const { accounts, deposits, accountsLoading, depositsLoading, depositMutation } = useBanking();

const showNewDeposit = ref(false);
const selectedAccount = ref('');
const depositAmount = ref(0);
const depositReference = ref('');
const depositNotes = ref('');

const recentDeposits = computed(() => deposits.value.slice(0, 10));

const totalBankBalance = computed(() =>
  accounts.value.reduce((sum, a) => sum + Number(a.currentBalance), 0),
);

const depositStatusIcons = {
  completed: { icon: Check, color: 'text-success', bg: 'bg-success/10' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  failed: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function handleDeposit() {
  if (!selectedAccount.value || depositAmount.value <= 0) return;
  await depositMutation.mutateAsync({
    bankAccountId: selectedAccount.value,
    amount: depositAmount.value,
    reference: depositReference.value,
    notes: depositNotes.value,
  });
  showNewDeposit.value = false;
  selectedAccount.value = '';
  depositAmount.value = 0;
  depositReference.value = '';
  depositNotes.value = '';
}

const depositFlow = [
  { label: 'Cash', step: 1, icon: Banknote },
  { label: 'Deposit', step: 2, icon: ArrowUp },
  { label: 'Bank Account', step: 3, icon: Building },
  { label: 'Confirmed', step: 4, icon: Check },
];
</script>

<template>
  <WorkspaceShell
    workspace-title="Banking"
    workspace-description="Bank accounts, deposits, and cash flow tracking"
  >
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium">Deposit Workflow</h2>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Banknote class="w-4 h-4" />
          <span v-for="(step, i) in depositFlow" :key="step.step" class="flex items-center">
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
              :class="i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted/30'"
            >
              {{ step.step }}
            </span>
            <span class="ml-1">{{ step.label }}</span>
            <ArrowRight class="w-3 h-3 mx-2" v-if="i < depositFlow.length - 1" />
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium">Bank Accounts</h2>
        <button @click="showNewDeposit = true" class="btn btn-primary touch-target">
          <Plus class="w-4 h-4 mr-2" />
          New Deposit
        </button>
      </div>

      <div v-if="accountsLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="card p-4 h-24 animate-pulse">
          <div class="h-4 bg-muted/30 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-muted/30 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="account in accounts"
          :key="account.id"
          class="card p-4"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <Building class="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 class="font-medium">{{ account.bankName }}</h3>
              <p class="text-sm text-muted-foreground">{{ account.accountHolderName }}</p>
            </div>
          </div>
          <div class="text-2xl font-bold mb-2">
            <MoneyDisplay :amount="account.currentBalance" />
          </div>
          <p class="text-xs text-muted-foreground">
            {{ account.currency }} · {{ account.accountNumber }}
          </p>
          <div class="mt-3 text-xs text-muted-foreground">
            <Calendar class="w-3 h-3 inline mr-1" />
            Updated {{ formatDate(account.createdAt) }}
          </div>
        </div>

        <div v-if="accounts.length === 0" class="col-span-full text-center py-8 text-muted-foreground">
          No bank accounts found.
        </div>
      </div>

      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium">Recent Deposits</h3>
          <div class="relative">
            <Search class="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search deposits..." class="input pl-8 w-48" />
          </div>
        </div>

        <div v-if="depositsLoading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-16 bg-muted/30 rounded animate-pulse"></div>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="deposit in recentDeposits"
            :key="deposit.id"
            class="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-6 h-6 rounded flex items-center justify-center"
                :class="depositStatusIcons[deposit.status.toLowerCase()]?.bg || 'bg-muted/30'"
              >
                <component
                  :is="depositStatusIcons[deposit.status.toLowerCase()]?.icon || Clock"
                  class="w-3 h-3"
                />
              </div>
              <div>
                <p class="font-medium text-sm">
                  <MoneyDisplay :amount="deposit.amount" />
                  <span class="text-xs text-muted-foreground ml-1">
                    to {{ deposit.bankAccount?.bankName }}
                  </span>
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ formatDate(deposit.depositedAt) }}
                  <span v-if="deposit.reference">· Ref: {{ deposit.reference }}</span>
                </p>
              </div>
            </div>
            <StatusBadge :status="deposit.status" />
          </div>

          <div v-if="recentDeposits.length === 0" class="text-center py-4 text-muted-foreground text-sm">
            No deposits recorded.
          </div>
        </div>
      </div>

      <div class="card p-4">
        <h3 class="font-medium mb-3">Deposit Timeline</h3>
        <div class="space-y-4">
          <div
            v-for="(deposit, i) in recentDeposits"
            :key="deposit.id"
            class="relative pb-4 border-l-2 border-border pl-4"
          >
            <div
              v-if="i === 0"
              class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-success"
            ></div>
            <div class="flex items-center gap-2 mb-1">
              <Calendar class="w-3 h-3 text-muted-foreground" />
              <span class="text-xs text-muted-foreground">{{ formatDate(deposit.depositedAt) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <ArrowUp class="w-4 h-4 text-success" />
              <span class="font-medium">Deposit</span>
              <MoneyDisplay :amount="deposit.amount" />
            </div>
            <p class="text-sm text-muted-foreground mt-1">
              {{ deposit.bankAccount?.bankName }} ({{ deposit.bankAccount?.accountNumber }})
            </p>
            <StatusBadge :status="deposit.status" />
          </div>

          <div v-if="recentDeposits.length === 0" class="text-center py-8 text-muted-foreground">
            No deposits to display.
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>

  <teleport to="body">
    <div
      v-if="showNewDeposit"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="card p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">New Deposit</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Record a deposit from cash drawer to bank.
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Bank Account</label>
            <select v-model="selectedAccount" class="input w-full">
              <option value="">Select Account</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id">
                {{ account.bankName }} - {{ account.accountNumber }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Amount</label>
            <input v-model.number="depositAmount" type="number" class="input w-full" min="0" step="0.01" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Reference</label>
            <input v-model="depositReference" type="text" class="input w-full" placeholder="Optional" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Notes</label>
            <input v-model="depositNotes" type="text" class="input w-full" placeholder="Optional" />
          </div>

          <div class="flex gap-2">
            <button @click="showNewDeposit = false" class="btn btn-outline flex-1">Cancel</button>
            <button
              @click="handleDeposit"
              :disabled="depositMutation.isPending || !selectedAccount || depositAmount <= 0"
              class="btn btn-primary flex-1"
            >
              {{ depositMutation.isPending ? 'Depositing...' : 'Deposit' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
