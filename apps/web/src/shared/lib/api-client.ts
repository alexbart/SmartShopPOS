import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { notification } from '@/stores/notification';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
      timeout: 30000,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        const message =
          error.response?.data?.error?.message || error.message || 'Unexpected error occurred';
        if (error.response?.status >= 400) {
          notification.error(message);
        }
        return Promise.reject(error);
      },
    );
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: unknown) {
    return this.client.post<T>(url, data);
  }

  patch<T = any>(url: string, data?: unknown) {
    return this.client.patch<T>(url, data);
  }

  put<T = any>(url: string, data?: unknown) {
    return this.client.put<T>(url, data);
  }

  delete<T = any>(url: string) {
    return this.client.delete<T>(url);
  }
}

export const apiClient = new ApiClient();

export interface OrganizationTheme {
  id: string;
  organizationId: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  themeMode: string;
  borderRadius: string;
  fontFamily: string | null;
  compactMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}
