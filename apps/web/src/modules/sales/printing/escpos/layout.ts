/**
 * Fixed-width text layout for a thermal roll.
 *
 * Everything here is pure string maths on a column budget, which keeps the
 * renderer deterministic and easy to assert in tests.
 */

/** Hard-breaks words that are longer than the column budget. */
export function wrapText(text: string, columns: number): string[] {
  const width = Math.max(1, Math.trunc(columns));
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter((word) => word.length > 0);

    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      if (candidate.length <= width) {
        current = candidate;
        continue;
      }

      if (current) lines.push(current);

      // A single word longer than the line is sliced across lines.
      let rest = word;
      while (rest.length > width) {
        lines.push(rest.slice(0, width));
        rest = rest.slice(width);
      }
      current = rest;
    }

    if (current) lines.push(current);
  }

  return lines;
}

/**
 * Lays out a label on the left and an amount on the right.
 * When both cannot share a line, the label wraps and the amount lands on the
 * final line so the numbers stay aligned.
 */
export function twoColumn(left: string, right: string, columns: number): string[] {
  const width = Math.max(1, Math.trunc(columns));
  const cleanLeft = left.trim();
  const cleanRight = right.trim();

  if (!cleanRight) return wrapText(cleanLeft, width);

  const availableForLeft = width - cleanRight.length - 1;

  if (availableForLeft < 1) {
    return [...wrapText(cleanLeft, width), cleanRight.slice(-width)];
  }

  const leftLines = wrapText(cleanLeft, availableForLeft);
  const lines = [...leftLines];
  const last = lines.pop() ?? '';
  lines.push(
    `${last}${' '.repeat(Math.max(1, width - last.length - cleanRight.length))}${cleanRight}`,
  );

  return lines;
}

export function divider(columns: number, char = '-'): string {
  return char.repeat(Math.max(1, Math.trunc(columns)));
}

export function center(text: string, columns: number): string {
  const width = Math.max(1, Math.trunc(columns));
  const clean = text.trim();
  if (clean.length >= width) return clean.slice(0, width);
  const pad = Math.floor((width - clean.length) / 2);
  return `${' '.repeat(pad)}${clean}`;
}

export function formatMoney(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function money(value: number, currency: string): string {
  return `${currency} ${formatMoney(value)}`;
}
