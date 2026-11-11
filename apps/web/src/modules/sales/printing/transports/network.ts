import { apiClient } from '@/shared/lib/api-client';
import { bytesToBase64 } from '../escpos/render';

export interface NetworkPrinterTarget {
  host: string;
  port: number;
}

/**
 * Hands the job to the API, which runs on the shop machine and can open a
 * socket to the printer. A browser cannot write to a raw TCP port itself, so
 * relaying through the local API avoids installing a print helper.
 */
export async function sendToNetworkPrinter(
  target: NetworkPrinterTarget,
  bytes: Uint8Array,
): Promise<void> {
  await apiClient.post('/printers/raw', {
    host: target.host.trim(),
    port: target.port,
    data: bytesToBase64(bytes),
  });
}
