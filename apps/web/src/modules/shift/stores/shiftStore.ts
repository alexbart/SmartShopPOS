import { defineStore } from 'pinia';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { useQueryClient } from '@tanstack/vue-query';
import type { CashDrawerSummary } from '@/shared/types';

export const useShiftStore = defineStore('shift', () => {
  const queryClient = useQueryClient();

  const shift = ref<{
    id: string;
    drawerSessionId: string;
    branchId: string;
    branchName: string;
    cashierName: string;
    openingFloat: number;
    openedAt: string;
    drawerName: string;
  } | null>(null);

  const drawerStatus = ref<'loading' | 'open' | 'closed'>('loading');

  const isShiftOpen = computed(() => drawerStatus.value === 'open');

  function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function startShift(session: CashDrawerSummary, cashierName: string) {
    const openedAt = session.session.openedAt;
    shift.value = {
      id: session.session.id,
      drawerSessionId: session.session.id,
      branchId: '',
      branchName: session.name,
      cashierName,
      openingFloat: session.session.openingFloat,
      openedAt,
      drawerName: session.name,
    };
    drawerStatus.value = 'open';
    localStorage.setItem('shift', JSON.stringify(shift.value));
    localStorage.setItem('shift-opened-at', openedAt);
  }

  function endShift() {
    shift.value = null;
    drawerStatus.value = 'closed';
    localStorage.removeItem('shift');
    localStorage.removeItem('shift-opened-at');
    queryClient.invalidateQueries({ queryKey: ['cash-drawer-current'] });
  }

  function loadFromStorage() {
    const stored = localStorage.getItem('shift');
    if (stored) {
      shift.value = JSON.parse(stored);
      drawerStatus.value = 'open';
    } else {
      drawerStatus.value = 'closed';
    }
  }

  async function checkDrawerStatus() {
    drawerStatus.value = 'loading';
    try {
      const response = await apiClient.get('/cash-drawers/current');
      const data: CashDrawerSummary = response.data.data;
      if (data?.session?.status === 'OPEN') {
        if (!shift.value) {
          startShift(data, data.name || 'Unknown');
        }
        drawerStatus.value = 'open';
      } else {
        drawerStatus.value = 'closed';
      }
    } catch {
      drawerStatus.value = 'closed';
    }
  }

  async function openDrawer(openingFloat: number, notes: string, cashierName: string = 'Cashier') {
    const response = await apiClient.post('/cash-drawers/open', {
      openingFloat,
      notes,
    });
    const session: CashDrawerSummary = response.data.data;
    startShift(session, cashierName);
    queryClient.invalidateQueries({ queryKey: ['cash-drawer-current'] });
    return true;
  }

  const tick = ref(0);
  const shiftTimer = ref<ReturnType<typeof setInterval> | null>(null);
  onMounted(() => {
    loadFromStorage();
    void checkDrawerStatus();
    shiftTimer.value = setInterval(() => {
      tick.value++;
    }, 1000);
  });

  const shiftDuration = computed(() => {
    tick.value; // reactive dependency
    if (!shift.value?.openedAt) return '00:00:00';
    const start = new Date(shift.value.openedAt).getTime();
    const now = Date.now();
    const diff = now - start;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });
  onUnmounted(() => {
    if (shiftTimer.value) clearInterval(shiftTimer.value);
  });

  return {
    shift,
    drawerStatus,
    isShiftOpen,
    shiftDuration,
    startShift,
    endShift,
    openDrawer,
    checkDrawerStatus,
    formatTime,
  };
});
