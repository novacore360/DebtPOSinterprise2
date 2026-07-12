// src/utils/receiptTemplates.js
// Turns purchase / customer data into a real, formatted thermal-receipt
// byte stream (ESC/POS) ready to be sent straight to a Bluetooth printer.

import { ReceiptBuilder } from './escpos';

const money = (n) => `P${(Number(n) || 0).toFixed(2)}`;
const widthFor = (storeInfo) => (storeInfo?.paperWidth === 80 ? 48 : 32);

/**
 * Single-sale customer receipt — printed right after a purchase is finalized.
 */
export function buildPurchaseReceipt({ storeInfo = {}, customer = {}, items = [], totalAmount = 0, date = new Date(), status = 'pending' }) {
  const width = widthFor(storeInfo);
  const b = new ReceiptBuilder(width);

  b.init();
  b.align('center');
  b.bold(true).size(2, 2).text(storeInfo.name || 'Marnie Store').newline();
  b.bold(false).size(1, 1);
  if (storeInfo.address) b.text(storeInfo.address).newline();
  if (storeInfo.phone)   b.text(`Tel: ${storeInfo.phone}`).newline();
  b.newline();
  b.bold(true).text('OFFICIAL RECEIPT').newline();
  b.bold(false);
  b.align('left');
  b.line('=');

  b.row('Date:', new Date(date).toLocaleString());
  b.row('Customer:', customer.name || 'Walk-in');
  if (customer.phone) b.row('Contact:', customer.phone);
  b.line('-');

  items.forEach(item => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const subtotal = item.subtotal != null ? Number(item.subtotal) : qty * price;
    b.text(item.name || 'Item').newline();
    b.row(`  ${qty} x ${money(price)}`, money(subtotal));
  });
  b.line('-');

  b.bold(true).size(1, 2);
  b.row('TOTAL', money(totalAmount));
  b.size(1, 1).bold(false);

  b.row('Status:', String(status).toUpperCase());
  b.newline();

  b.align('center');
  b.text(storeInfo.footer || 'Thank you for your purchase!').newline();
  b.text('Please keep this receipt.').newline();
  b.feed(3);
  b.cut(true);

  return b.build();
}

/**
 * Full customer purchase-history statement/report — e.g. for a customer who
 * wants a printed summary of everything they've bought / owe.
 */
export function buildCustomerReport({ storeInfo = {}, customer = {}, purchases = [] }) {
  const width = widthFor(storeInfo);
  const b = new ReceiptBuilder(width);
  const totalSpent = purchases.reduce((s, p) => s + (Number(p.total_amount) || 0), 0);
  const totalPaid  = purchases.filter(p => p.status === 'paid').reduce((s, p) => s + (Number(p.total_amount) || 0), 0);
  const totalDue   = totalSpent - totalPaid;

  b.init();
  b.align('center');
  b.bold(true).size(2, 2).text(storeInfo.name || 'Marnie Store').newline();
  b.bold(false).size(1, 1);
  if (storeInfo.address) b.text(storeInfo.address).newline();
  if (storeInfo.phone)   b.text(`Tel: ${storeInfo.phone}`).newline();
  b.newline();
  b.bold(true).text('CUSTOMER STATEMENT').newline();
  b.bold(false);
  b.align('left');
  b.line('=');

  b.row('Customer:', customer.name || '-');
  if (customer.phone) b.row('Phone:', customer.phone);
  if (customer.email) b.row('Email:', customer.email);
  b.row('Printed:', new Date().toLocaleString());
  b.line('-');

  if (purchases.length === 0) {
    b.align('center').text('No purchases on record.').newline();
  } else {
    purchases
      .slice()
      .sort((a, c) => new Date(a.purchase_date) - new Date(c.purchase_date))
      .forEach(p => {
        b.bold(true).text(new Date(p.purchase_date).toLocaleDateString()).bold(false);
        b.text(`  [${String(p.status || 'pending').toUpperCase()}]`).newline();
        (p.product_data || p.items || []).forEach(i => {
          const qty = Number(i.quantity) || 0;
          const price = Number(i.price) || 0;
          b.row(`  ${i.name} x${qty}`, money(price * qty));
        });
        b.row('  Subtotal', money(p.total_amount));
        b.newline();
      });
    b.line('-');
    b.bold(true);
    b.row('Total Purchased', money(totalSpent));
    b.row('Total Paid', money(totalPaid));
    b.row('Balance Due', money(totalDue));
    b.bold(false);
  }

  b.newline();
  b.align('center');
  b.text(storeInfo.footer || 'Thank you for your business!').newline();
  b.feed(3);
  b.cut(true);

  return b.build();
}
