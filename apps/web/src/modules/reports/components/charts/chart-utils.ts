export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

export type ChartKind = 'bar' | 'hbar' | 'donut' | 'line';

export interface ChartSpec {
  key: string;
  title: string;
  description?: string;
  /** Short total/caption rendered on the right of the card header. */
  meta?: string;
  kind: ChartKind;
  items: ChartDatum[];
  formatter?: (value: number) => string;
  /** Label inside the donut hole. */
  centerLabel?: string;
}

// Mid-tone palette that stays legible on both light and dark card surfaces,
// matching the colours already used by the dashboard charts.
export const CHART_PALETTE = [
  '#0f766e',
  '#2563eb',
  '#7c3aed',
  '#d97706',
  '#db2777',
  '#0891b2',
  '#65a30d',
  '#ea580c',
] as const;

export const NEGATIVE_COLOR = '#dc2626';

export function formatCurrency(value: number, currency = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value ?? 0);
}

export function colorize(items: ChartDatum[]): ChartDatum[] {
  return items.map((item, index) => ({
    ...item,
    color: item.color ?? CHART_PALETTE[index % CHART_PALETTE.length],
  }));
}

/** Keeps the largest `count` entries and folds the remainder into a single "Other" slice. */
export function topWithOther(items: ChartDatum[], count: number): ChartDatum[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= count) return sorted;

  const head = sorted.slice(0, count);
  const other = sorted.slice(count).reduce((sum, item) => sum + item.value, 0);
  return other > 0 ? [...head, { label: 'Other', value: other }] : head;
}

/** Sums a numeric field of each row, grouped by a label. */
export function groupSum<T>(
  rows: T[],
  labelOf: (row: T) => string | null | undefined,
  valueOf: (row: T) => number,
): ChartDatum[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = labelOf(row);
    if (!label) continue;
    totals.set(label, (totals.get(label) ?? 0) + valueOf(row));
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value }));
}

/** Counts rows per label. */
export function countBy<T>(
  rows: T[],
  labelOf: (row: T) => string | null | undefined,
): ChartDatum[] {
  return groupSum(rows, labelOf, () => 1);
}

/** Buckets rows into calendar days, oldest first, labelled for a short axis. */
export function bucketByDay<T>(
  rows: T[],
  dateOf: (row: T) => string | Date | null | undefined,
  valueOf: (row: T) => number,
): ChartDatum[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const raw = dateOf(row);
    if (!raw) continue;
    const date = raw instanceof Date ? raw : new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + valueOf(row));
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      label: new Date(`${key}T12:00:00`).toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
      }),
      value,
    }));
}
