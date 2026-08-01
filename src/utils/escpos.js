// src/utils/escpos.js
// Minimal ESC/POS command builder used to talk directly to thermal receipt
// printers over Bluetooth (no third-party "print" app needed).
// Reference: standard ESC/POS command set supported by nearly every
// 58mm / 80mm thermal printer (Bluetooth SPP or BLE).

const encoder = new TextEncoder();

// Thermal printers are almost all single-byte code pages — the ₱ (peso) glyph
// and other non-ASCII symbols are not reliably supported, so we swap them for
// plain-ASCII equivalents before sending bytes to the printer.
function sanitize(str = '') {
  return String(str)
    .replace(/₱/g, 'P')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, '-')
    .replace(/•/g, '*')
    // strip anything else outside printable ASCII to avoid garbled output
    .replace(/[^\x09\x0A\x20-\x7E]/g, '');
}

export class ReceiptBuilder {
  /** @param {number} width characters per printed line (32 = 58mm paper, 48 = 80mm paper) */
  constructor(width = 32) {
    this.width = width;
    this.bytes = [];
  }

  raw(...arr) { this.bytes.push(...arr); return this; }

  text(str = '') {
    this.bytes.push(...encoder.encode(sanitize(str)));
    return this;
  }

  newline(n = 1) { for (let i = 0; i < n; i++) this.bytes.push(0x0a); return this; }

  init() { return this.raw(0x1b, 0x40); } // ESC @

  align(pos) { // 'left' | 'center' | 'right'
    const map = { left: 0, center: 1, right: 2 };
    return this.raw(0x1b, 0x61, map[pos] ?? 0); // ESC a n
  }

  bold(on) { return this.raw(0x1b, 0x45, on ? 1 : 0); } // ESC E n

  underline(on) { return this.raw(0x1b, 0x2d, on ? 1 : 0); } // ESC - n

  /** width/height multipliers, 1 = normal size, up to 8 */
  size(w = 1, h = 1) {
    const n = ((Math.max(1, Math.min(w, 8)) - 1) << 4) | (Math.max(1, Math.min(h, 8)) - 1);
    return this.raw(0x1d, 0x21, n); // GS ! n
  }

  line(char = '-') { return this.text(char.repeat(this.width)).newline(); }

  /** Two-column row: left-aligned text ... right-aligned text, wraps left text if too long */
  row(left = '', right = '') {
    left = String(left); right = String(right);
    let space = this.width - left.length - right.length;
    if (space < 1) {
      const maxLeft = Math.max(0, this.width - right.length - 1);
      if (maxLeft > 0 && left.length > maxLeft) {
        this.text(left).newline();
        left = '';
      }
      space = Math.max(1, this.width - left.length - right.length);
    }
    return this.text(left + ' '.repeat(space) + right).newline();
  }

  /** Centered plain text line */
  centerText(str) { return this.align('center').text(str).newline(); }

  feed(n = 3) { return this.raw(0x1b, 0x64, n); } // ESC d n — feed n lines

  cut(partial = true) { return this.raw(0x1d, 0x56, partial ? 1 : 0); } // GS V n

  /** Opens the cash drawer if one is wired to the printer (RJ11) — harmless if not present */
  openDrawer() { return this.raw(0x1b, 0x70, 0x00, 0x19, 0xfa); }

  build() { return new Uint8Array(this.bytes); }
}
