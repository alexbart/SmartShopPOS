import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@/shared/lib/api-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Organization {
  id: string;
  name: string;
  code: string;
}

interface AuthResponse {
  user: User;
  organization: Organization;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const organization = ref<Organization | null>(null);
  const branch = ref<{ id: string; name: string } | null>(null);
  const accessToken = ref<string | null>(null);
  const roles = ref<string[]>([]);

  const isAuthenticated = computed(() => !!accessToken.value);

  async function fetchMe() {
    try {
      const response = await apiClient.get('/auth/me');
      const data = response.data.data;
      user.value = {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      };
      organization.value = {
        id: data.organization.id,
        name: data.organization.name,
        code: data.organization.code,
      };
      branch.value = data.branch ? { id: data.branch.id, name: data.branch.name } : null;
      roles.value = data.roles || [];
    } catch {
      logout();
    }
  }

  function setAuth(data: AuthResponse) {
    user.value = data.user;
    organization.value = data.organization;
    accessToken.value = data.tokens.accessToken;
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('organization', JSON.stringify(data.organization));
    void fetchMe();
  }

  function loadFromStorage() {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    const storedOrg = localStorage.getItem('organization');
    if (token && storedUser && storedOrg) {
      accessToken.value = token;
      user.value = JSON.parse(storedUser);
      organization.value = JSON.parse(storedOrg);
      void fetchMe();
    }
  }

  async function login(email: string, password: string, organizationCode: string) {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
      organizationCode,
    });
    setAuth(response.data.data);
    return response.data.data;
  }

  async function register(payload: {
    organizationName: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
    ownerPhone: string;
    password: string;
  }) {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    setAuth(response.data.data);
    return response.data.data;
  }

  function logout() {
    user.value = null;
    organization.value = null;
    branch.value = null;
    accessToken.value = null;
    roles.value = [];
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
  }

  return {
    user,
    organization,
    branch,
    accessToken,
    roles,
    isAuthenticated,
    login,
    register,
    logout,
    loadFromStorage,
  };
});
