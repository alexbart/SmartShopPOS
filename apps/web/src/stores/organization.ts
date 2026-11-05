import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import type { ReceiptBranding } from '@/modules/sales/composables/types';

/**
 * Caches the organization identity printed on receipts and tickets.
 * Loaded once per app session so printing never waits on the network.
 */
export const useOrganizationStore = defineStore('organization', () => {
  const branding = ref<ReceiptBranding | null>(null);
  const loaded = ref(false);
  let pending: Promise<void> | null = null;

  async function ensureLoaded(force = false): Promise<void> {
    if (loaded.value && !force) return;
    if (pending) return pending;

    pending = (async () => {
      try {
        const response = await apiClient.get('/organization/branding');
        branding.value = response.data.data as ReceiptBranding;
        loaded.value = true;
      } catch {
        // Branding is cosmetic: a failed load must never block selling or printing.
      } finally {
        pending = null;
      }
    })();

    return pending;
  }

  function reset() {
    branding.value = null;
    loaded.value = false;
  }

  return {
    branding,
    loaded,
    ensureLoaded,
    reset,
  };
});
