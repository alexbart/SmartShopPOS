import { Socket } from 'node:net';
import { ValidationError } from '../../../shared/errors/business-error.js';
import {
  MAX_PRINT_JOB_BYTES,
  type RawPrintInput,
  type RawPrintResult,
} from '../dto/printer.dto.js';

const CONNECT_TIMEOUT_MS = 5000;
const DEFAULT_PORT = 9100;

/**
 * A raw ESC/POS relay.
 *
 * The API runs on the shop's own machine, so it can reach a LAN printer that a
 * browser cannot. The endpoint is deliberately narrow: authenticated, byte
 * capped, and restricted to private IPv4 addresses so it can never be used as
 * a general-purpose TCP proxy.
 */
export class PrinterService {
  async sendRaw(input: RawPrintInput): Promise<RawPrintResult> {
    const host = input.host.trim();
    const port = input.port || DEFAULT_PORT;

    this.assertLocalAddress(host);

    const bytes = Buffer.from(input.data, 'base64');

    if (bytes.length === 0) {
      throw new ValidationError('The print job is empty.');
    }

    if (bytes.length > MAX_PRINT_JOB_BYTES) {
      throw new ValidationError('The print job is too large.');
    }

    await this.write(host, port, bytes);

    return { bytes: bytes.length, host, port };
  }

  /**
   * Only literal private IPv4 literals are accepted. Refusing hostnames also
   * refuses DNS rebinding, which would otherwise turn this into an SSRF hole.
   */
  private assertLocalAddress(host: string): void {
    const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);

    if (!match) {
      throw new ValidationError(
        'Printer address must be a LAN IPv4 address, for example 192.168.1.50.',
      );
    }

    const octets = match.slice(1, 5).map((part) => Number(part));

    if (octets.some((octet) => octet > 255)) {
      throw new ValidationError('Printer address is not a valid IPv4 address.');
    }

    const [first, second] = octets;
    const isPrivate =
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first === 127;

    if (!isPrivate) {
      throw new ValidationError('Printer address must be on the local network.');
    }
  }

  private write(host: string, port: number, bytes: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const socket = new Socket();
      let settled = false;

      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        const error = new Error(message) as Error & { code: string; statusCode: number };
        error.code = 'PRINTER_UNAVAILABLE';
        error.statusCode = 502;
        reject(error);
      };

      const timer = setTimeout(
        () => fail(`Printer at ${host}:${port} did not respond in time.`),
        CONNECT_TIMEOUT_MS,
      );

      socket.setNoDelay(true);

      socket.once('error', () => {
        fail(`Could not reach the printer at ${host}:${port}. Check it is on and on this network.`);
      });

      socket.once('close', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      });

      socket.connect(port, host, () => {
        socket.write(bytes, () => socket.end());
      });
    });
  }
}
