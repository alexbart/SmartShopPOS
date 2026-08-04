import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';

export interface CashDrawerSession {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openingFloat: number;
  closingFloat: number | null;
  totalSales: number;
  totalRefunds: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedCash: number;
  countedCash: number | null;
  variance: number | null;
  openedAt: string;
  closedAt: string | null;
  movements?: CashMovement[];
}

export interface CashMovement {
  id: string;
  type: string;
  amount: number;
  referenceType?: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  _count?: { expenses: number };
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  expenseDate: string;
  paymentReference?: string;
  status: string;
  categoryId: string;
  category?: ExpenseCategory;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface Deposit {
  id: string;
  bankAccountId: string;
  bankAccount?: BankAccount;
  amount: number;
  reference?: string;
  depositedAt: string;
  depositedBy: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export function useCashDrawer() {
  const queryClient = useQueryClient();

  const { data: drawerData, isLoading: drawerLoading } = useQuery({
    queryKey: ['cash-drawer-current'],
    queryFn: async () => {
      const res = await apiClient.get('/cash-drawers/current');
      return res.data.data as CashDrawerSession;
    },
    staleTime: 30_000,
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['cash-drawer-movements'],
    queryFn: async () => {
      const res = await apiClient.get('/cash-drawers/current/movements');
      return res.data.data.items as CashMovement[];
    },
    enabled: () => !!drawerData.value?.session,
    staleTime: 30_000,
  });

  const session = computed(() => {
    if (!drawerData.value) return null;
    return drawerData.value.session ?? drawerData.value;
  });

  const movements = computed(
    () => movementsData.value ?? drawerData.value?.session?.movements ?? [],
  );

  const openMutation = useMutation({
    mutationFn: (openingFloat: number) => apiClient.post('/cash-drawers/open', { openingFloat }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-current'] });
      notification.success('Cash drawer opened');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (countedCash: number) =>
      apiClient.post(`/cash-drawers/${session.value?.id}/close`, { countedCash }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-current'] });
      const variance = res.data?.data?.variance ?? 0;
      if (Math.abs(variance) > 0.01) {
        notification.warning(
          'Cash drawer closed with variance',
          `Variance: KES ${Number(variance).toLocaleString()}`,
        );
      } else {
        notification.success('Cash drawer closed');
      }
    },
  });

  const cashInMutation = useMutation({
    mutationFn: (payload: { amount: number; notes?: string }) =>
      apiClient.post(`/cash-drawers/${session.value?.id}/cash-in`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-current'] });
      notification.success('Cash added to drawer');
    },
  });

  return {
    session,
    movements,
    isLoading: drawerLoading,
    movementsLoading,
    openMutation,
    closeMutation,
    cashInMutation,
  };
}

export function useExpenses(
  params: () => {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
  },
) {
  const queryClient = useQueryClient();
  const {
    data: expResponse,
    isLoading,
    error: expError,
  } = useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const p = params();
      const q = new URLSearchParams();
      if (p.page) q.set('page', String(p.page));
      if (p.limit) q.set('limit', String(p.limit));
      if (p.status) q.set('status', p.status);
      if (p.categoryId) q.set('categoryId', p.categoryId);

      const res = await apiClient.get(`/finance/expenses?${q.toString()}`);
      return res.data.data as { items: Expense[]; total: number; pages: number };
    },
    staleTime: 60_000,
  });

  const expenses = computed(() => expResponse.value?.items ?? []);
  const total = computed(() => expResponse.value?.total ?? 0);

  const expenseCategories = useExpenseCategories();
  const categories = expenseCategories.categories;
  const categoriesLoading = expenseCategories.isLoading;

  const createMutation = useMutation({
    mutationFn: (payload: {
      categoryId: string;
      amount: number;
      description: string;
      expenseDate: string;
      paymentReference?: string;
    }) => apiClient.post('/finance/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      notification.success('Expense recorded');
    },
  });

  return {
    expenses,
    total,
    isLoading,
    error: expError,
    createMutation,
    categories,
    categoriesLoading,
  };
}

export function useExpenseCategories() {
  const { data: catData, isLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await apiClient.get('/finance/categories');
      return res.data.data as ExpenseCategory[];
    },
    staleTime: 60_000,
  });

  const categories = computed(() => catData.value ?? []);

  return {
    categories,
    isLoading,
  };
}

export function useBanking() {
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await apiClient.get('/banking/bank-accounts');
      return res.data.data as BankAccount[];
    },
    staleTime: 60_000,
  });

  const { data: depositsData, isLoading: depositsLoading } = useQuery({
    queryKey: ['bank-deposits'],
    queryFn: async () => {
      const res = await apiClient.get('/banking/deposits');
      return res.data.data as Deposit[];
    },
    staleTime: 60_000,
  });

  const accounts = computed(() => accountsData.value ?? []);
  const deposits = computed(() => depositsData.value ?? []);

  const depositMutation = useMutation({
    mutationFn: (payload: {
      bankAccountId: string;
      amount: number;
      reference?: string;
      notes?: string;
    }) => apiClient.post('/banking/deposits', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      notification.success('Deposit recorded');
    },
  });

  return {
    accounts,
    deposits,
    accountsLoading,
    depositsLoading,
    depositMutation,
  };
}

export function useFinanceDashboard() {
  const { session, movements, isLoading: drawerLoading } = useCashDrawer();
  const { expenses, isLoading: expensesLoading } = useExpenses(() => ({ page: 1, limit: 50 }));
  const { accounts, isLoading: accountsLoading } = useBanking();

  const dashboardData = computed(() => {
    const recentExpenses = expenses.value.slice(0, 5);
    const totalExpenses = expenses.value.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalDeposits = accounts.value.reduce((sum, a) => sum + Number(a.currentBalance), 0);

    return {
      todayRevenue: session.value?.totalSales ?? 0,
      todayExpenses: totalExpenses,
      cashDrawerBalance: session.value?.expectedCash ?? session.value?.openingFloat ?? 0,
      bankBalance: totalDeposits,
      profitToday: (session.value?.totalSales ?? 0) - totalExpenses,
      recentExpenses,
      drawerStatus: session.value?.status ?? 'CLOSED',
    };
  });

  return {
    dashboardData,
    isLoading: drawerLoading || expensesLoading || accountsLoading,
  };
}
