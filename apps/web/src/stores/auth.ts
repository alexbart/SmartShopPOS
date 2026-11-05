import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { clearStoredSession, saveStoredSession } from '@/shared/lib/session';

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
  const rolesLoaded = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value);

  async function fetchMe() {
    try {
      const response = await apiClient.get('/auth/me');
      const data: any = response.data.data;
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
      rolesLoaded.value = true;
    } catch {
      logout();
    }
  }

  function setAuth(data: AuthResponse) {
    user.value = data.user;
    organization.value = data.organization;
    accessToken.value = data.tokens.accessToken;
    saveStoredSession({
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      user: data.user,
      organization: data.organization,
    });
    void fetchMe();
  }

  async function login(email: string, password: string, organizationCode: string) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      organizationCode,
    });
    const data = response.data.data as AuthResponse;
    setAuth(data);
    return data;
  }

  async function register(payload: {
    organizationName: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
    ownerPhone: string;
    password: string;
  }) {
    const response = await apiClient.post('/auth/register', payload);
    const data = response.data.data as AuthResponse;
    setAuth(data);
    return data;
  }

  function logout() {
    user.value = null;
    organization.value = null;
    branch.value = null;
    accessToken.value = null;
    roles.value = [];
    rolesLoaded.value = false;
    clearStoredSession();
  }

  return {
    user,
    organization,
    branch,
    accessToken,
    roles,
    rolesLoaded,
    isAuthenticated,
    login,
    register,
    logout,
  };
});
