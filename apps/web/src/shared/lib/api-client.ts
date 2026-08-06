import axios, { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig } from 'axios';
import { notification } from '@/stores/notification';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

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
      async (error) => {
        if (error.response?.status === 401) {
          const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

          if (originalRequest._retry) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshPromise = this.refreshAccessToken(refreshToken);
          }

          try {
            const newToken = await this.refreshPromise;
            if (newToken) {
              localStorage.setItem('accessToken', newToken);
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              originalRequest._retry = true;
              return this.client(originalRequest);
            }
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
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

  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`,
        { refreshToken },
      );
      return response.data?.data?.accessToken ?? null;
    } catch {
      return null;
    }
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T = unknown>(url: string, data?: unknown) {
    return this.client.post<T>(url, data);
  }

  patch<T = unknown>(url: string, data?: unknown) {
    return this.client.patch<T>(url, data);
  }

  put<T = unknown>(url: string, data?: unknown) {
    return this.client.put<T>(url, data);
  }

  delete<T = unknown>(url: string) {
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
