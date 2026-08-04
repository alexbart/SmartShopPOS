<script setup lang="ts">
import { ref, computed, h } from 'vue';
import {
  Receipt,
  Upload,
  Check,
  X,
  Clock,
  FileText,
  Eye,
  Download,
  Filter,
  Search,
  Plus,
  Trash2,
} from '@lucide/vue';
import { useExpenses } from './composables/useFinance.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';
import StatusBadge from '@/components/business/StatusBadge.vue';

const { expenses, total, isLoading, createMutation, categories } = useExpenses(() => ({
  page: 1,
  limit: 50,
}));

const showNewExpense = ref(false);
const showReceiptUpload = ref(false);
const filterStatus = ref('all');
const searchQuery = ref('');
const selectedCategory = ref('');

const expenseForm = ref({
  categoryId: '',
  amount: 0,
  description: '',
  expenseDate: new Date().toISOString().split('T')[0],
  paymentReference: '',
});

const uploadFiles = ref<File[]>([]);

const filteredExpenses = computed(() => {
  let result = expenses.value;
  if (filterStatus.value !== 'all') {
    result = result.filter((e) => e.status.toLowerCase() === filterStatus.value);
  }
  if (searchQuery.value) {
    result = result.filter(
      (e) =>
        e.description?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        e.category?.name?.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
  }
  if (selectedCategory.value) {
    result = result.filter((e) => e.categoryId === selectedCategory.value);
  }
  return result;
});

const expensesByStatus = computed(() => {
  const byStatus: Record<string, number> = {};
  for (const e of expenses.value) {
    byStatus[e.status.toLowerCase()] = (byStatus[e.status.toLowerCase()] || 0) + 1;
  }
  return byStatus;
});

const totalByCategory = computed(() => {
  const byCategory: Record<string, { name: string; total: number; color: string }> = {};
  for (const e of expenses.value) {
    const catName = e.category?.name || 'Uncategorized';
    if (!byCategory[e.categoryId]) {
      byCategory[e.categoryId] = { name: catName, total: 0, color: 'blue' };
    }
    byCategory[e.categoryId].total += Number(e.amount);
  }
  return Object.entries(byCategory)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);
});

const statusIcons = {
  approved: { icon: Check, color: 'text-success', bg: 'bg-success/10' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  rejected: { icon: X, color: 'text-destructive', bg: 'bg-destructive/10' },
};

const categoryColors: Record<string, string> = {};
const colorPalette = ['blue', 'green', 'purple', 'orange', 'rose', 'teal'];
let colorIdx = 0;
for (const cat of categories.value) {
  categoryColors[cat.id] = colorPalette[colorIdx % colorPalette.length];
  colorIdx++;
}

async function handleSubmit() {
  if (!expenseForm.value.categoryId || expenseForm.value.amount <= 0) return;
  await createMutation.mutateAsync(expenseForm.value);
  showNewExpense.value = false;
  expenseForm.value = {
    categoryId: '',
    amount: 0,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
  };
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    uploadFiles.value = Array.from(target.files);
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer?.files) {
    uploadFiles.value = Array.from(e.dataTransfer.files);
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}

function removeFile(index: number) {
  uploadFiles.value.splice(index, 1);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getExpenseStatusLabel(status: string) {
  const labels: Record<string, string> = {
    APPROVED: 'Approved',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
  };
  return labels[status.toUpperCase()] ?? status;
}

function getExpenseStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === 'approved') return Check;
  if (s === 'pending') return Clock;
  if (s === 'rejected') return X;
  return FileText;
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Expenses"
    workspace-description="Track and manage business expenses"
  >
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search expenses..."
              class="input pl-8 w-48"
            />
          </div>
          <select v-model="filterStatus" class="input">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select v-model="selectedCategory" class="input">
            <option value="">All Categories</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <button @click="showNewExpense = true" class="btn btn-primary touch-target">
          <Plus class="w-4 h-4 mr-2" />
          New Expense
        </button>
      </div>

      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="card p-4 h-32 animate-pulse">
          <div class="h-4 bg-muted/30 rounded mb-2 w-3/4"></div>
          <div class="h-3 bg-muted/30 rounded mb-1 w-1/2"></div>
          <div class="h-3 bg-muted/30 rounded w-1/4"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="expense in filteredExpenses"
          :key="expense.id"
          class="card p-4 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded flex items-center justify-center"
                :class="statusIcons[expense.status.toLowerCase()]?.bg || 'bg-muted/30'"
              >
                <component
                  :is="statusIcons[expense.status.toLowerCase()]?.icon || FileText"
                  class="w-3 h-3"
                />
              </div>
              <span class="font-medium text-sm">{{ expense.category?.name || 'Uncategorized' }}</span>
            </div>
            <StatusBadge :status="expense.status" />
          </div>

          <MoneyDisplay :amount="expense.amount" size="lg" class="font-bold mb-2" />
          <p class="text-sm text-muted-foreground mb-2 line-clamp-2">
            {{ expense.description || 'No description' }}
          </p>

          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>{{ formatDate(expense.expenseDate) }}</span>
            <div v-if="expense.paymentReference" class="flex items-center gap-1">
              <FileText class="w-3 h-3" />
              <span>{{ expense.paymentReference }}</span>
            </div>
          </div>

          <div v-if="expense.status.toLowerCase() === 'approved' && expense.approvedBy" class="mt-2 text-xs text-muted-foreground">
            Approved by {{ expense.approvedBy }} on {{ expense.approvedAt ? formatDate(expense.approvedAt) : '' }}
          </div>
        </div>

        <div
          v-if="filteredExpenses.length === 0"
          class="col-span-full text-center py-8 text-muted-foreground"
        >
          No expenses found.
        </div>
      </div>

      <div v-if="filteredExpenses.length > 0" class="card p-4">
        <h3 class="font-medium mb-3">Expenses by Category</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            v-for="cat in totalByCategory"
            :key="cat.id"
            class="card p-3 text-center"
          >
            <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <span class="text-xs font-bold">{{ cat.name.charAt(0) }}</span>
            </div>
            <MoneyDisplay :amount="cat.total" size="sm" />
            <p class="text-xs text-muted-foreground">{{ cat.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>

  <teleport to="body">
    <div
      v-if="showNewExpense"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="card p-6 w-full max-w-lg">
        <h3 class="text-lg font-bold mb-4">New Expense</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <select v-model="expenseForm.categoryId" class="input col-span-2" required>
              <option value="">Select Category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ c.name }} ({{ c.code }})
              </option>
            </select>
            <div class="col-span-2">
              <label class="block text-sm font-medium mb-1">Amount</label>
              <input v-model.number="expenseForm.amount" type="number" class="input w-full" min="0" step="0.01" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Date</label>
              <input v-model="expenseForm.expenseDate" type="date" class="input w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Reference</label>
              <input v-model="expenseForm.paymentReference" type="text" class="input w-full" placeholder="Optional" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium mb-1">Description</label>
              <input v-model="expenseForm.description" type="text" class="input w-full" placeholder="What was this for?" />
            </div>
          </div>

          <div class="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <Upload class="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">Drag & drop receipts or click to upload</p>
            <input
              type="file"
              class="hidden"
              id="receipt-upload"
              multiple
              @change="handleFileUpload"
              accept="image/*,.pdf"
            />
            <label for="receipt-upload" class="text-primary text-sm cursor-pointer">Browse files</label>
          </div>

          <div
            v-if="uploadFiles.length > 0"
            class="flex flex-wrap gap-2"
          >
            <div
              v-for="(file, i) in uploadFiles"
              :key="i"
              class="flex items-center gap-1 bg-muted/20 rounded px-2 py-1 text-xs"
            >
              <FileText class="w-3 h-3" />
              <span>{{ file.name }}</span>
              <button @click="removeFile(i)" class="text-muted-foreground hover:text-destructive">
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="showNewExpense = false" class="btn btn-outline flex-1">Cancel</button>
            <button
              @click="handleSubmit"
              :disabled="createMutation.isPending || !expenseForm.categoryId || expenseForm.amount <= 0"
              class="btn btn-primary flex-1"
            >
              {{ createMutation.isPending ? 'Recording...' : 'Record Expense' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
