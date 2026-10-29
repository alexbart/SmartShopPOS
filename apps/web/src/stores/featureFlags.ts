import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@/shared/lib/api-client';

export type FeatureKey = 'pos' | 'inventory' | 'purchasing' | 'finance' | 'reporting' | 'workflow' | 'loyalty' | 'ecommerce' | 'ai' | 'sms';

export const useFeatureFlagsStore = defineStore('featureFlags', () => {
  const flags = ref<Record<string, boolean>>({});
  const loaded = ref(false);

  const isFeatureEnabled = computed(() => {
    return (key: FeatureKey): boolean => {
      if (!loaded.value) return false;
      return flags.value[key] ?? false;
    };
  });

  async function loadFlags(): Promise<void> {
    try {
      const response = await apiClient.get('/feature-flags');
      flags.value = response.data;
      loaded.value = true;
    } catch (error) {
      console.warn('Failed to load feature flags, using defaults', error);
      flags.value = {
        pos: true,
        inventory: true,
        purchasing: true,
        finance: true,
        reporting: true,
        workflow: true,
        loyalty: false,
        ecommerce: false,
        ai: false,
        sms: false,
      };
      loaded.value = true;
    }
  }

  function checkFeature(key: FeatureKey): boolean {
    return flags.value[key] ?? false;
  }

  return {
    flags,
    loaded,
    isFeatureEnabled,
    loadFlags,
    checkFeature,
  };
});
