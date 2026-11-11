import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

export type PrinterConnection = 'browser' | 'network';

export interface PrinterProfile {
  /** 'browser' opens the print dialog; 'network' sends ESC/POS over the LAN. */
  connection: PrinterConnection;
  host: string;
  port: number;
  cut: boolean;
}

const STORAGE_KEY = 'smartshop.printerProfile';

const DEFAULT_PROFILE: PrinterProfile = {
  connection: 'browser',
  host: '',
  port: 9100,
  cut: true,
};

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isValidPrinterHost(host: string): boolean {
  const match = IPV4.exec(host.trim());
  return Boolean(match) && match!.slice(1).every((part) => Number(part) <= 255);
}

function readProfile(): PrinterProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };

    const parsed = JSON.parse(raw) as Partial<PrinterProfile>;
    return {
      connection: parsed.connection === 'network' ? 'network' : 'browser',
      host: typeof parsed.host === 'string' ? parsed.host : '',
      port: Number.isInteger(parsed.port) ? Number(parsed.port) : DEFAULT_PROFILE.port,
      cut: parsed.cut !== false,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Printer settings belong to the till, not the organization: two counters in
 * the same shop can drive different printers. They are therefore kept in
 * localStorage instead of the database.
 */
export const usePrinterStore = defineStore('printer', () => {
  const profile = ref<PrinterProfile>(readProfile());

  // A network profile is only usable once it points at a real LAN address.
  const canPrintToNetwork = computed(
    () => profile.value.connection === 'network' && isValidPrinterHost(profile.value.host),
  );

  function update(next: Partial<PrinterProfile>) {
    profile.value = { ...profile.value, ...next };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.value));
    } catch {
      // A blocked storage quota must not break printing.
    }
  }

  return { profile, canPrintToNetwork, update };
});
