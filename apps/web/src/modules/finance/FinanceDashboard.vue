<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Banknote,
  Receipt,
  Calendar,
} from '@lucide/vue';
import { useFinanceDashboard } from './composables/useFinance.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';
import StatusBadge from '@/components/business/StatusBadge.vue';

const router = useRouter();
const { dashboardData, isLoading } = useFinanceDashboard();

const d = computed(() => dashboardData.value);

const summaryCards = computed(() => [
  {
    title: 'Today Revenue',
    value: d.value.todayRevenue,
    icon: TrendingUp,
    trend: 'up',
    currency: true,
  },
  {
    title: 'Today Expenses',
    value: d.value.todayExpenses,
    icon: TrendingDown,
    trend: d.value.todayExpenses > 5000 ? 'down' : 'neutral',
    currency: true,
  },
  {
    title: 'Cash Drawer',
    value: d.value.cashDrawerBalance,
    icon: PiggyBank,
    currency: true,
    subtitle: d.value.drawerStatus === 'OPEN' ? 'Open' : 'Closed',
  },
  {
    title: 'Bank Balance',
    value: d.value.bankBalance,
    icon: Banknote,
    currency: true,
  },
  {
    title: 'Profit Today',
    value: d.value.profitToday,
    icon: ShoppingCart,
    currency: true,
    trend: d.value.profitToday > 0 ? 'up' : 'down',
  },
]);

const quickActions = [
  { label: 'New Expense', icon: Receipt, action: () => router.push('/expenses') },
  { label: 'Deposit Cash', icon: Banknote, action: () => router.push('/banking') },
  { label: 'Open Drawer', icon: PiggyBank, action: () => router.push('/cash-drawer') },
  { label: 'End of Day', icon: Calendar, action: () => router.push('/finance/closing') },
];
</script>

<template>
  <WorkspaceShell
    workspace-title="Finance"
    workspace-description="Cash drawer, expenses, deposits, and financial overview"
  >
    <div class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div
          v-for="card in summaryCards"
          :key="card.title"
          class="card p-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">{{ card.title }}</p>
              <p class="text-2xl font-bold mt-1">
                <MoneyDisplay :amount="card.value" />
              </p>
              <p v-if="card.subtitle" class="text-xs text-muted-foreground mt-1">
                {{ card.subtitle }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/30">
              <component :is="card.icon" class="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 pb-4 border-b">
        <button
          v-for="action in quickActions"
          :key="action.label"
          @click="action.action"
          class="btn btn-outline btn-sm touch-target"
        >
          <component :is="action.icon" class="w-3 h-3 mr-1" />
          {{ action.label }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium">Recent Expenses</h3>
            <button
              @click="router.push('/expenses')"
              class="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>

          <div v-if="isLoading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="h-12 bg-muted/30 rounded animate-pulse"></div>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="expense in d.recentExpenses"
              :key="expense.id"
              class="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <Receipt class="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p class="font-medium text-sm">
                    {{ expense.description || expense.category?.name }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ new Date(expense.expenseDate).toLocaleDateString('en-KE') }}
                    <span v-if="expense.category?.name">· {{ expense.category.name }}</span>
                  </p>
                </div>
              </div>
              <div class="text-right">
                <MoneyDisplay :amount="expense.amount" size="sm" />
                <StatusBadge :status="expense.status" />
              </div>
            </div>

            <div
              v-if="d.recentExpenses.length === 0"
              class="text-center py-4 text-muted-foreground text-sm"
            >
              No expenses recorded today.
            </div>
          </div>
        </div>

        <div class="card p-4">
          <h3 class="font-medium mb-3">Cash Drawer Status</h3>

          <div v-if="isLoading" class="animate-pulse space-y-3">
            <div class="h-4 bg-muted/30 rounded w-3/4"></div>
            <div class="h-4 bg-muted/30 rounded w-1/2"></div>
          </div>

          <div v-else class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Status</span>
              <span>
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="
                    d.drawerStatus === 'OPEN'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted/30 text-muted-foreground'
                  "
                >
                  {{ d.drawerStatus }}
                </span>
              </span>
            </div>

            <div v-if="d.drawerStatus === 'OPEN'" class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Expected Cash</span>
                <MoneyDisplay :amount="d.cashDrawerBalance" />
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Total Sales</span>
                <MoneyDisplay :amount="d.todayRevenue" />
              </div>
            </div>

            <button
              v-if="d.drawerStatus === 'OPEN'"
              @click="router.push('/cash-drawer')"
              class="w-full btn btn-outline btn-sm touch-target mt-2"
            >
              View Drawer Details
            </button>
            <button
              v-else
              @click="router.push('/cash-drawer')"
              class="w-full btn btn-primary btn-sm touch-target mt-2"
            >
              Open Cash Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
