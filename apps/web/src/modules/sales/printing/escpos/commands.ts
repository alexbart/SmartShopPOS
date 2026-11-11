/**
 * Minimal ESC/POS command set covering what a receipt needs.
 * Reference: Epson ESC/POS Command Reference (TM-T88 / generic compatible).
 */

export const ESC = 0x1b;
export const GS = 0x1d;
export const LF = 0x0a;

/** Initialize the printer and clear its buffer. */
export function init(): number[] {
  return [ESC, 0x40];
}

/** Select the PC437 character table (the default on most thermal printers). */
export function selectCodeTable437(): number[] {
  return [ESC, 0x74, 0x00];
}

export type AlignMode = 'left' | 'center' | 'right';

const ALIGN_CODES: Record<AlignMode, number> = {
  left: 0,
  center: 1,
  right: 2,
};

export function align(mode: AlignMode): number[] {
  return [ESC, 0x61, ALIGN_CODES[mode]];
}

export function bold(enabled: boolean): number[] {
  return [ESC, 0x45, enabled ? 1 : 0];
}

/** Font A is 12x24 dots, Font B is 9x17 — Font B fits more columns per line. */
export function fontA(): number[] {
  return [ESC, 0x4d, 0x00];
}

export function fontB(): number[] {
  return [ESC, 0x4d, 0x01];
}

/** Character width/height multipliers, each 1-8. */
export function textSize(width: number, height: number): number[] {
  const w = Math.min(8, Math.max(1, Math.trunc(width)));
  const h = Math.min(8, Math.max(1, Math.trunc(height)));
  return [GS, 0x21, ((w - 1) << 4) | (h - 1)];
}

/** Line spacing in dots (feed units); ESC 2 restores the printer default. */
export function lineSpacing(dots: number): number[] {
  return [ESC, 0x33, Math.min(255, Math.max(0, Math.trunc(dots)))];
}

export function defaultLineSpacing(): number[] {
  return [ESC, 0x32];
}

/** Advance n lines. */
export function feed(lines: number): number[] {
  return [ESC, 0x64, Math.min(255, Math.max(0, Math.trunc(lines)))];
}

/** Partial cut with a small feed so the cut lands below the last line. */
export function cutPaper(): number[] {
  return [GS, 0x56, 0x42, 0x00];
}
