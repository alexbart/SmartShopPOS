import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type {
  Organization,
  User,
  Role,
  Branch,
  Tax,
  AuditEntry,
  Integration,
  HealthStatus,
  Permission,
} from './types.js';

export function useOrganization() {
  const queryClient = useQueryClient();

  const { data: orgData, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const res = await apiClient.get('/organization');
      return (res.data as { data: Organization }).data as Organization;
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

  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/users');
      const data = (res.data as { data: User[] | { items?: User[] } }).data;
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 60_000,
  });

  const users = computed(() => usersData.value ?? []);

  const createUserMutation = useMutation({
    mutationFn: (payload: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      roleId?: string;
      branchId?: string;
    }) => apiClient.post('/auth/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notification.success('User created');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (
      payload: { id: string } & Partial<User> & { roleId?: string; isActive?: boolean },
    ) => {
      const { id, ...data } = payload;
      return apiClient.patch(`/auth/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notification.success('User updated');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: { userId: string; password: string }) =>
      apiClient.post(`/auth/users/${payload.userId}/reset-password`, {
        password: payload.password,
      }),
    onSuccess: () => {
      notification.success('Password reset');
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.patch(`/auth/users/${userId}/deactivate`),
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
      const res = await apiClient.get('/auth/roles');
      const data = (res.data as { data: Role[] | { items?: Role[] } }).data;
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 60_000,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/permissions');
      const data = (res.data as { data: Permission[] | { items?: Permission[] } }).data;
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 60_000,
  });

  const roles = computed(() => rolesData.value ?? []);
  const permissions = computed(() => permissionsData.value ?? []);

  const createRoleMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; permissionIds: string[] }) =>
      apiClient.post('/auth/roles', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notification.success('Role created');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      name: string;
      description?: string;
      permissionIds: string[];
    }) => apiClient.patch(`/auth/roles/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notification.success('Role updated');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => apiClient.delete(`/auth/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notification.success('Role deleted');
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
    deleteRoleMutation,
  };
}

export function useBranches() {
  const queryClient = useQueryClient();

  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      const responseData = (res.data as { data: { items?: Branch[] } }).data;
      if (!responseData) return [];
      return responseData.items ?? responseData ?? [];
    },
    staleTime: 60_000,
  });

  const branches = computed(() => (branchesData.value || []) as Branch[]);

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
      const responseData = (res.data as { data: { items?: Tax[] } }).data;
      if (!responseData) return [];
      return responseData.items ?? responseData ?? [];
    },
    staleTime: 60_000,
  });

  const taxes = computed(() => (taxesData.value || []) as Tax[]);

  return {
    taxes,
    taxesLoading: isLoading,
  };
}

export function useAuditLog(
  params: () => {
    page?: number;
    limit?: number;
    resource?: string;
  },
) {
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-log', params],
    queryFn: async () => {
      const p = params();
      const q = new URLSearchParams();
      if (p.page) q.set('page', String(p.page));
      if (p.limit) q.set('limit', String(p.limit));
      if (p.resource) q.set('resource', p.resource);

      const res = await apiClient.get(`/audit?${q.toString()}`);
      return (res.data as { data: { items: AuditEntry[]; total: number } }).data as {
        items: AuditEntry[];
        total: number;
      };
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
      return (res.data as { data: HealthStatus[] }).data as HealthStatus[];
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
    const usersList = Array.isArray(users.value) ? users.value : [];
    const branchesList = Array.isArray(branches.value) ? branches.value : [];
    const rolesList = Array.isArray(roles.value) ? roles.value : [];

    const activeUsers = usersList.filter((u) => u.status === 'active' || !u.status).length;
    const employeeCount = branchesList.reduce((sum, b) => sum + (b.employeeCount ?? 0), 0);
    const openBranches = branchesList.filter((b) => (b.status ?? 'OPEN') === 'OPEN').length;
    const pendingUsers = usersList.filter((u) => u.status === 'pending').length;

    return {
      activeUsers,
      totalBranches: branchesList.length,
      totalRoles: rolesList.length,
      pendingInvites: pendingUsers,
      openBranches,
      totalEmployees: employeeCount,
      organizationName:
        organization.value?.businessName || organization.value?.name || 'SmartShopPOS',
      license: 'Business Edition',
    };
  });

  const isLoading = usersLoading || branchesLoading || rolesLoading;

  return {
    dashboardData,
    isLoading,
  };
}

export type {
  Organization,
  User,
  Role,
  Permission,
  Branch,
  Tax,
  AuditEntry,
  Integration,
  HealthStatus,
} from './types.js';
