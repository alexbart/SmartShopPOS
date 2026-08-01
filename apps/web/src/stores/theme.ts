import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { apiClient } from '@/shared/lib/api-client';

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  border: string;
  radius: string;
  fontFamily: string;
  compactMode: boolean;
  darkMode: boolean;
  logo: string | null;
  businessName: string;
}

const defaultTheme: ThemeConfig = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  accent: '#f59e0b',
  background: '#f9fafb',
  card: '#ffffff',
  border: '#e5e7eb',
  radius: '0.5rem',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  compactMode: false,
  darkMode: false,
  logo: null,
  businessName: 'SmartShopPOS',
};

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h *= 60;
    if (h < 0) h += 360;
  }

  return `${h.toFixed(0)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', hexToHsl(theme.primary));
  root.style.setProperty('--color-primary_hover', hexToHsl(theme.primary));
  root.style.setProperty('--color-secondary', hexToHsl(theme.secondary));
  root.style.setProperty('--color-accent', hexToHsl(theme.accent));
  root.style.setProperty('--color-background', hexToHsl(theme.background));
  root.style.setProperty('--color-card', hexToHsl(theme.card));
  root.style.setProperty('--color-border', hexToHsl(theme.border));
  root.style.setProperty('--radius', theme.radius);
  root.style.setProperty('--font-body', theme.fontFamily);

  if (theme.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  if (theme.compactMode) {
    document.documentElement.classList.add('compact');
  } else {
    document.documentElement.classList.remove('compact');
  }
}

function getStoredTheme(): ThemeConfig {
  const stored = localStorage.getItem('theme');
  if (stored) {
    try {
      return { ...defaultTheme, ...JSON.parse(stored) };
    } catch {
      return { ...defaultTheme };
    }
  }
  return { ...defaultTheme };
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeConfig>(getStoredTheme());

  watch(
    () => theme.value,
    (newTheme) => {
      applyTheme(newTheme);
      localStorage.setItem('theme', JSON.stringify(newTheme));
    },
    { immediate: true, deep: true },
  );

  function updateTheme(updates: Partial<ThemeConfig>) {
    theme.value = { ...theme.value, ...updates };
  }

  function resetTheme() {
    theme.value = { ...defaultTheme };
  }

  async function loadTheme() {
    try {
      const response = await apiClient.get<Record<string, unknown>>('/theme');
      const data = response.data.data;
      if (data) {
        updateTheme({
          primary: data.primaryColor ?? theme.value.primary,
          secondary: data.secondaryColor ?? theme.value.secondary,
          accent: data.accentColor ?? theme.value.accent,
          logo: data.logoUrl ?? theme.value.logo,
          darkMode: data.themeMode === 'dark',
          compactMode: data.compactMode ?? false,
          radius: data.borderRadius ?? theme.value.radius,
          fontFamily: data.fontFamily ?? theme.value.fontFamily,
        });
      }
    } catch {
      // No theme set, use default
    }
  }

  async function saveTheme() {
    try {
      await apiClient.patch('/theme', {
        primaryColor: theme.value.primary,
        secondaryColor: theme.value.secondary,
        accentColor: theme.value.accent,
        logoUrl: theme.value.logo,
        themeMode: theme.value.darkMode ? 'dark' : 'light',
        compactMode: theme.value.compactMode,
        borderRadius: theme.value.radius,
        fontFamily: theme.value.fontFamily,
      });
    } catch {
      // Save to localStorage only
      localStorage.setItem('theme', JSON.stringify(theme.value));
    }
  }

  return { theme, updateTheme, resetTheme, loadTheme, saveTheme };
});

applyTheme(getStoredTheme());
