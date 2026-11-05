import { getPrisma } from '../../shared/database/prisma.js';

/**
 * Branding applied to every generated workbook so a spreadsheet found on a
 * shared drive can be traced back to an organization, a document and a moment
 * in time.
 */

export interface WorkbookLogo {
  base64: string;
  extension: 'png' | 'jpeg' | 'gif';
}

export interface WorkbookBrand {
  organizationName: string;
  organizationCode: string;
  tagline?: string;
  contactLine?: string;
  currency: string;
  documentTitle: string;
  documentId: string;
  generatedAt: Date;
  timezone: string;
  generatedBy?: string;
  logo?: WorkbookLogo;
}

const LOGO_TIMEOUT_MS = 2500;
const MAX_LOGO_BYTES = 512 * 1024;

const EXTENSION_BY_MIME: Record<string, WorkbookLogo['extension']> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/gif': 'gif',
};

/** Renders a moment in the organization's timezone, falling back to UTC. */
export function formatInTimeZone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  }
}

/** Short, human-quotable reference such as PRDIMP-20261105-4F2A. */
export function buildDocumentId(prefix: string, at: Date): string {
  const stamp = at.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

/** Appends a local-time stamp so filenames cannot collide within a day. */
export function timestampedFilename(base: string, at: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(
    at.getHours(),
  )}${pad(at.getMinutes())}`;
  return `${base}-${stamp}`;
}

function normalizeDataUrl(value: string): WorkbookLogo | undefined {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(value);
  if (!match) return undefined;
  const extension = EXTENSION_BY_MIME[match[1].toLowerCase()];
  if (!extension) return undefined;
  return { base64: match[2], extension };
}

async function loadLogo(logoUrl: string | null): Promise<WorkbookLogo | undefined> {
  if (!logoUrl) return undefined;
  if (logoUrl.startsWith('data:')) return normalizeDataUrl(logoUrl);
  if (!/^https?:\/\//i.test(logoUrl)) return undefined;

  try {
    const response = await fetch(logoUrl, { signal: AbortSignal.timeout(LOGO_TIMEOUT_MS) });
    if (!response.ok) return undefined;

    const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim();
    const extension = EXTENSION_BY_MIME[contentType.toLowerCase()];
    if (!extension) return undefined;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_LOGO_BYTES) return undefined;
    return { base64: buffer.toString('base64'), extension };
  } catch {
    // A missing or slow logo must degrade to text, never fail the export.
    return undefined;
  }
}

interface BuildBrandOptions {
  organizationId: string;
  documentTitle: string;
  /** Short uppercase prefix, e.g. PRDIMP for a product import. */
  documentIdPrefix: string;
  generatedBy?: string;
}

export async function buildWorkbookBrand(options: BuildBrandOptions): Promise<WorkbookBrand> {
  const organization = await getPrisma().organization.findUnique({
    where: { id: options.organizationId },
    select: {
      name: true,
      code: true,
      tagline: true,
      email: true,
      phone: true,
      currency: true,
      timezone: true,
      logoUrl: true,
    },
  });

  const generatedAt = new Date();

  return {
    organizationName: organization?.name ?? 'SmartShopPOS',
    organizationCode: organization?.code ?? '',
    tagline: organization?.tagline ?? undefined,
    contactLine:
      [organization?.email, organization?.phone].filter(Boolean).join('  ·  ') || undefined,
    currency: organization?.currency ?? 'KES',
    documentTitle: options.documentTitle,
    documentId: buildDocumentId(options.documentIdPrefix, generatedAt),
    generatedAt,
    timezone: organization?.timezone ?? 'Africa/Nairobi',
    generatedBy: options.generatedBy,
    logo: await loadLogo(organization?.logoUrl ?? null),
  };
}
