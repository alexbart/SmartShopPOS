import { ref } from 'vue';
import { usePrinterStore } from '@/stores/printer';
import { renderReceiptEscPos } from './escpos/render';
import { sendToNetworkPrinter } from './transports/network';
import type { EscPosInput } from './types';

/**
 * 'sent'    – the ESC/POS job reached the printer.
 * 'browser' – no network printer is configured; use window.print().
 * 'failed'  – the printer was unreachable; the API client already reported it.
 */
export type PrintOutcome = 'sent' | 'browser' | 'failed';

/**
 * Renders and sends a receipt using the till's configured transport.
 * The caller keeps the final say on falling back to the browser dialog.
 */
export function useReceiptPrinter() {
  const printer = usePrinterStore();
  const sending = ref(false);

  async function printReceipt(input: EscPosInput): Promise<PrintOutcome> {
    if (!printer.canPrintToNetwork) return 'browser';

    sending.value = true;

    try {
      const bytes = renderReceiptEscPos({
        ...input,
        options: { ...input.options, cut: printer.profile.cut },
      });

      await sendToNetworkPrinter(printer.profile, bytes);

      return 'sent';
    } catch {
      return 'failed';
    } finally {
      sending.value = false;
    }
  }

  return { printer, sending, printReceipt };
}
