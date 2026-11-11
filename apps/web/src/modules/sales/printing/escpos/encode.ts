/**
 * Text → PC437 byte encoding.
 *
 * Only the characters a receipt realistically contains are mapped; anything
 * unmapped degrades to '?' rather than printing random glyphs on the roll.
 * Currency codes (KES) are plain ASCII, so no currency symbol is required.
 */

const CP437_EXTRA: Record<string, number> = {
  // Western European letters
  Ç: 0x80,
  ü: 0x81,
  é: 0x82,
  â: 0x83,
  ä: 0x84,
  à: 0x85,
  å: 0x86,
  ç: 0x87,
  ê: 0x88,
  ë: 0x89,
  è: 0x8a,
  ï: 0x8b,
  î: 0x8c,
  ì: 0x8d,
  Ä: 0x8e,
  Å: 0x8f,
  É: 0x90,
  æ: 0x91,
  Æ: 0x92,
  ô: 0x93,
  ö: 0x94,
  ò: 0x95,
  û: 0x96,
  ù: 0x97,
  ÿ: 0x98,
  Ö: 0x99,
  Ü: 0x9a,
  á: 0xa0,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  ñ: 0xa4,
  Ñ: 0xa5,
  ã: 0xc6,
  õ: 0xd4,
  // Punctuation and symbols
  '’': 0x27,
  '‘': 0x27,
  '“': 0x22,
  '”': 0x22,
  '–': 0x2d,
  '—': 0x2d,
  '·': 0xfa,
  '•': 0x07,
  '°': 0xf8,
  '±': 0xf1,
  '÷': 0xf6,
  '≈': 0xf7,
  '×': 0x78,
  '²': 0xfd,
  // Strip characters thermal printers cannot represent.
  '\u00a0': 0x20,
  '\t': 0x20,
};

/**
 * Encodes text to PC437 bytes. Line breaks are never added here — the layout
 * layer owns line structure.
 */
export function encodeText(text: string): number[] {
  const bytes: number[] = [];

  for (const char of text) {
    const extra = CP437_EXTRA[char];
    if (extra !== undefined) {
      bytes.push(extra);
      continue;
    }

    const code = char.codePointAt(0) ?? 0x3f;
    bytes.push(code >= 0x20 && code <= 0x7e ? code : 0x3f);
  }

  return bytes;
}
