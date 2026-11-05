<script setup lang="ts">
import { Boxes, ClipboardList, CreditCard, FileClock, ShoppingCart, Users } from '@lucide/vue';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const categories = [
  { title: 'Sales', description: 'Sales totals, cashier and customer activity, payment breakdowns.', path: '/reports/sales', icon: ShoppingCart, reports: ['Sales by period', 'Payment breakdown'] },
  { title: 'Inventory', description: 'On hand, low stock, out of stock, and stock movement history.', path: '/reports/inventory', icon: Boxes, reports: ['Current stock', 'Stock movements', 'Low and out of stock'] },
  { title: 'Purchasing', description: 'Purchase summaries, supplier rankings, open orders, and late deliveries.', path: '/reports/purchasing', icon: ClipboardList, reports: ['Purchase summary', 'Outstanding orders', 'Late deliveries'] },
  { title: 'Customers', description: 'Customer summaries and highest spending customers.', path: '/reports/customers', icon: Users, reports: ['Customer summary', 'Top customers'] },
  { title: 'Finance', description: 'Cash sessions, expenses, cash variance, and payments by method.', path: '/reports/finance', icon: CreditCard, reports: ['Daily cash summary', 'Expense report', 'Cash drawer variance'] },
  { title: 'Audit & security', description: 'Search activity and security events, inspect change data, and verify the audit chain.', path: '/admin/audit', icon: FileClock, reports: ['Activity and changes', 'Authentication outcomes', 'Integrity verification'] },
];
</script>

<template>
  <WorkspaceShell workspace-title="Reports" workspace-description="Operational, financial, customer, and audit reporting">
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <RouterLink v-for="category in categories" :key="category.title" :to="category.path" class="rounded-xl border bg-card p-5 transition hover:border-primary/50 hover:shadow-sm">
        <div class="flex items-start gap-3">
          <span class="rounded-lg bg-primary/10 p-2 text-primary"><component :is="category.icon" class="h-5 w-5" /></span>
          <div class="min-w-0"><h2 class="font-semibold">{{ category.title }}</h2><p class="mt-1 text-sm text-muted-foreground">{{ category.description }}</p></div>
        </div>
        <ul class="mt-4 space-y-1 text-sm text-muted-foreground"><li v-for="report in category.reports" :key="report">· {{ report }}</li></ul>
        <span class="mt-4 inline-block text-sm font-medium text-primary">Open reports →</span>
      </RouterLink>
    </div>
    <p class="mt-5 text-xs text-muted-foreground">Profit and historical stock valuation are not included yet because the current data does not preserve the cost and balance snapshots needed for reliable historical figures.</p>
  </WorkspaceShell>
</template>
