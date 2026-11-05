import { createHash } from 'node:crypto';

export function canonicalizeAuditValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalizeAuditValue).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalizeAuditValue(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function hashAuditValue(value: unknown): string {
  return createHash('sha256').update(canonicalizeAuditValue(value)).digest('hex');
}
