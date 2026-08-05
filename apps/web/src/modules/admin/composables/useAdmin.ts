import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Organization, User, Role, Branch, Tax, AuditEntry, Integration, HealthStatus } from './types.js';

export function useOrganization() {
  const queryClient = useQueryClient();

  const { data: orgData, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const res = await apiClient.get('/organization');
      return res.data.data as Organization;
    },
    staleTime: 60_000,
  });

  const organization = computed(() => orgData.value ?? null);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Organization>) => apiClient.patch('/organization', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      notification.success('Organization updated');
    },
  });

  return {
    organization,
    organizationLoading: isLoading,
    updateMutation,
  };
}

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data.data as User[];
    },
    staleTime: 60_000,
  });

  const users = computed(() => usersData.value ?? []);

  const createUserMutation = useMutation({
    mutationFn: (payload: { email: string; firstName: string; lastName: string; role: string; branchId?: string }) =>
      apiClient.post('/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notification.success('User created');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: { id: string } & Partial<User>) => apiClient.patch(`/users/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notification.success('User updated');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => apiClient.post(`/users/${userId}/reset-password`),
    onSuccess: () => {
      notification.success('Password reset email sent');
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.patch(`/users/${userId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notification.success('User deactivated');
    },
  });

  return {
    users,
    usersLoading: isLoading,
    usersError: error,
    createUserMutation,
    updateUserMutation,
    resetPasswordMutation,
    deactivateUserMutation,
  };
}

export function useRoles() {
  const queryClient = useQueryClient();

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data.data as Role[];
    },
    staleTime: 60_000,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/permissions');
      return res.data.data as Permission[];
    },
    staleTime: 60_000,
  });

  const roles = computed(() => rolesData.value ?? []);
  const permissions = computed(() => permissionsData.value ?? []);

  const createRoleMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; permissionIds: string[] }) =>
      apiClient.post('/roles', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notification.success('Role created');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { id: string; name: string; description?: string; permissionIds: string[] }) =>
      apiClient.patch(`/roles/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notification.success('Role updated');
    },
  });

  const allPermissionsGrouped = computed(() => {
    const groups: Record<string, Permission[]> = {};
    for (const p of permissions.value) {
      const group = p.resource.charAt(0).toUpperCase() + p.resource.slice(1);
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    }
    return groups;
  });

  return {
    roles,
    rolesLoading: isLoading,
    permissions,
    allPermissionsGrouped,
    createRoleMutation,
    updateRoleMutation,
  };
}

export function useBranches() {
  const queryClient = useQueryClient();

  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      return res.data.data as Branch[];
    },
    staleTime: 60_000,
  });

  const branches = computed(() => branchesData.value ?? []);

  const updateBranchMutation = useMutation({
    mutationFn: (payload: { id: string } & Partial<Branch>) =>
      apiClient.patch(`/warehouses/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      notification.success('Branch updated');
    },
  });

  return {
    branches,
    branchesLoading: isLoading,
    updateBranchMutation,
  };
}

export function useTaxes() {
  const { data: taxesData, isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: async () => {
      const res = await apiClient.get('/taxes');
      return res.data.data as Tax[];
    },
    staleTime: 60_000,
  });

  const taxes = computed(() => taxesData.value ?? []);

  return {
    taxes,
    taxesLoading: isLoading,
  };
}

export function useAuditLog(params: () => {
  page?: number;
  limit?: number;
  resource?: string;
}) {
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-log', params],
    queryFn: async () => {
      const p = params();
      const q = new URLSearchParams();
      if (p.page) q.set('page', String(p.page));
      if (p.limit) q.set('limit', String(p.limit));
      if (p.resource) q.set('resource', p.resource);

      const res = await apiClient.get(`/audit?${q.toString()}`);
      return res.data.data as { items: AuditEntry[]; total: number };
    },
    staleTime: 60_000,
  });

  const entries = computed(() => auditData.value?.items ?? []);
  const total = computed(() => auditData.value?.total ?? 0);

  return {
    entries,
    total,
    auditLoading: isLoading,
  };
}

export function useHealth() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await apiClient.get('/health');
      return res.data as HealthStatus[];
    },
    staleTime: 30_000,
  });

  const services = computed(() => healthData.value ?? []);

  return {
    services,
    healthLoading: isLoading,
  };
}

export function useIntegrations() {
  const integrations: Integration[] = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      icon: 'smartpay',
      status: 'configured',
      description: 'Kenya mobile money payments',
    },
    {
      id: 'email',
      name: 'Email',
      icon: 'mail',
      status: 'connected',
      description: 'SendGrid SMTP',
    },
    {
      id: 'redis',
      name: 'Redis',
      icon: 'database',
      status: 'disabled',
      description: 'Cache and queue',
    },
    {
      id: 's3',
      name: 'S3',
      icon: 'cloud',
      status: 'not_configured',
      description: 'Cloud storage',
    },
  ];

  return {
    integrations,
  };
}

export function useAdminDashboard() {
  const { users, usersLoading } = useUsers();
  const { branches, branchesLoading } = useBranches();
  const { roles, rolesLoading } = useRoles();
  const { organization } = useOrganization();

  const dashboardData = computed(() => {
    const activeUsers = users.value.filter((u) => u.status === 'active' || !u.status).length;
    const employeeCount = branches.value.reduce((sum, b) => sum + (b.employeeCount ?? 0), 0);
    const openBranches = branches.value.filter((b) => (b.status ?? 'OPEN') === 'OPEN').length;
    const pendingUsers = users.value.filter((u) => u.status === 'pending').length;

    return {
      activeUsers,
      totalBranches: branches.value.length,
      totalRoles: roles.value.length,
      pendingInvites: pendingUsers,
      openBranches,
      totalEmployees: employeeCount,
      organizationName: organization.value?.businessName || organization.value?.name || 'SmartShopPOS',
      license: 'Business Edition',
    };
  });

  const isLoading = usersLoading || branchesLoading || rolesLoading;

  return {
    dashboardData,
    isLoading,
  };
}

export type { Organization, User, Role, Permission, Branch, Tax, AuditEntry, Integration, HealthStatus } from './types.js';
