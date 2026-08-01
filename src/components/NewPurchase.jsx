import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Barcode, ShoppingCart, CheckCircle, X, Search, Bluetooth, BluetoothConnected, Printer } from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import { usePrinter } from '../context/PrinterContext';
import { buildPurchaseReceipt } from '../utils/receiptTemplates';

const iStyle = {
  width:'100%', padding:'11px 12px',
  background:'var(--wa-06)',
  border:'1px solid var(--wa-1)',
  borderRadius:10, color:'var(--text-primary)', fontSize:14,
  outline:'none', boxSizing:'border-box',
  transition:'border-color 0.2s',
};
const focusIn  = (e) => { e.target.style.borderColor='#4e73df'; e.target.style.boxShadow='0 0 0 2px rgba(78,115,223,0.2)'; };
const focusOut = (e) => { e.target.style.borderColor='var(--wa-1)'; e.target.style.boxShadow='none'; };

const card = { background:'var(--wa-03)', border:'1px solid var(--wa-07)', borderRadius:14, padding:16 };
const lbl  = { color:'var(--wa-55)', fontSize:12, marginBottom:5, display:'block', fontWeight:600, letterSpacing:.3 };

export default function NewPurchase({ products, customers, addPurchase, addCustomer, updateProduct }) {
  const { print, status: printerStatus, printerName, error: printerError, isSupported: bluetoothSupported, storeInfo } = usePrinter();
  const [printing, setPrinting] = useState(false);
  const [customerName, setCustomerName]     = useState('');
  const [customerPhone, setCustomerPhone]   = useState('');
  const [customerEmail, setCustomerEmail]   = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [custSuggestions, setCustSuggestions]   = useState([]);

  const [productSearch, setProductSearch]   = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [qty, setQty]                       = useState(1);

  const [cart, setCart]         = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [finalizing, setFinalizing]   = useState(false);
  const [receipt, setReceipt]         = useState(null);
  const [toast, setToast]             = useState('');

  const custInputRef    = useRef(null);
  const productInputRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Customer autocomplete
  useEffect(() => {
    if (!customerName.trim() || selectedCustomer) { setCustSuggestions([]); return; }
    const q = customerName.toLowerCase();
    setCustSuggestions(customers.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 6));
  }, [customerName, customers, selectedCustomer]);

  // Product autocomplete — name or productCode
  useEffect(() => {
    if (!productSearch.trim() || selectedProduct) { setProductSuggestions([]); return; }
    const q = productSearch.toLowerCase();
    setProductSuggestions(
      products.filter(p => p.name?.toLowerCase().includes(q) || p.productCode?.toLowerCase().includes(q)).slice(0, 8)
    );
  }, [productSearch, products, selectedProduct]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    setCustSuggestions([]);
  };
  const clearCustomer = () => { setSelectedCustomer(null); setCustomerName(''); setCustomerPhone(''); setCustomerEmail(''); };

  const selectProduct = (p) => { setSelectedProduct(p); setProductSearch(p.name); setProductSuggestions([]); };

  // Barcode scan → search productCode in database, auto-fill product
  const handleBarcodeScan = useCallback((code) => {
    const found = products.find(p =>
      p.productCode === code || p.productCode?.toLowerCase() === code.toLowerCase()
    );
    if (found) {
      selectProduct(found);
    } else {
      showToast(`No product found for barcode: "${code}"`);
    }
  }, [products]);

  const addToCart = () => {
    if (!selectedProduct) return showToast('Please select a product.');
    const available = selectedProduct.stock || 0;
    const qtyNum = parseInt(qty) || 0;
    if (qtyNum < 1)         return showToast('Quantity must be at least 1.');
    if (qtyNum > available) return showToast(`Only ${available} units available.`);

    const existing = cart.find(i => i.product_id === selectedProduct.id);
    if (existing) {
      const newQty = existing.quantity + qtyNum;
      if (newQty > available) return showToast(`Only ${available} units available.`);
      setCart(cart.map(i => i.product_id === selectedProduct.id
        ? { ...i, quantity: newQty, subtotal: i.price * newQty } : i));
    } else {
      const price = selectedProduct.retailPrice || selectedProduct.price || 0;
      setCart([...cart, {
        product_id: selectedProduct.id,
        name:       selectedProduct.name,
        price,
        quantity:   qtyNum,
        subtotal:   price * qtyNum,
      }]);
    }
    setSelectedProduct(null); setProductSearch(''); setQty(1);
  };

  const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));
  const updateQty = (idx, newQty) => {
    if (newQty < 1) return;
    const item    = cart[idx];
    const product = products.find(p => p.id === item.product_id);
    if (newQty > (product?.stock || 0)) return showToast(`Only ${product?.stock || 0} in stock.`);
    setCart(cart.map((item, i) => i === idx ? { ...item, quantity: newQty, subtotal: item.price * newQty } : item));
  };

  const cartTotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const totalItems = cart.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0);

  const finalizePurchase = async () => {
    if (cart.length === 0)        return showToast('Cart is empty.');
    if (!customerName.trim())     return showToast('Customer name is required.');
    setFinalizing(true);
    try {
      let customer = selectedCustomer;
      if (!customer) {
        customer = await addCustomer({ name: customerName.trim(), phone: customerPhone, email: customerEmail });
      }

      // items stored in product_data — no cost_price field (matches Firebase structure)
      const items = cart.map(item => ({
        product_id: item.product_id,
        name:       item.name,
        price:      item.price,
        quantity:   item.quantity,
        subtotal:   item.subtotal,
      }));

      await addPurchase({
        customer_id:   customer.id,
        customer_name: customer.name,
        items,
        total_amount:  cartTotal,
        status:        'pending',
        purchase_date: new Date().toISOString(),
      });

      // Deduct stock
      for (const item of cart) {
        const p = products.find(p => p.id === item.product_id);
        if (p) await updateProduct(item.product_id, { stock: Math.max(0, (p.stock || 0) - item.quantity) });
      }

      setReceipt({ customer, items: [...cart], totalAmount: cartTotal, date: new Date() });
      setCart([]); setCustomerName(''); setCustomerPhone(''); setCustomerEmail(''); setSelectedCustomer(null);
    } catch (err) {
      showToast('Failed: ' + err.message);
    } finally {
      setFinalizing(false);
    }
  };

  const printBluetoothReceipt = async () => {
    if (!receipt) return;
    setPrinting(true);
    try {
      const bytes = buildPurchaseReceipt({
        storeInfo,
        customer: receipt.customer,
        items: receipt.items,
        totalAmount: receipt.totalAmount,
        date: receipt.date,
        status: 'pending',
      });
      const ok = await print(bytes);
      if (ok) showToast('Receipt sent to printer ✓');
      else showToast('Could not print: ' + (printerError || 'connection failed'));
    } catch (err) {
      showToast('Print failed: ' + err.message);
    } finally {
      setPrinting(false);
    }
  };

  const printReceipt = () => {
    if (!receipt) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;max-width:320px;margin:0 auto;padding:16px;font-size:12px;background:#fff;color:#000}
  @media print{body{padding:8px}.noprint{display:none}}
  h3,h4{text-align:center;margin:3px 0}
  .ln{border-top:1px dashed #000;margin:8px 0}
  table{width:100%}td{padding:2px 0}.r{text-align:right}
  .tot{font-size:14px;font-weight:bold}
  .btn{margin-top:12px;display:flex;gap:8px}
  button{flex:1;padding:8px;cursor:pointer;border:1px solid #333;background:#fff;border-radius:4px;font-size:13px}
</style></head><body>
<h3>Marnie Store</h3><h4>Official Receipt</h4>
<div class="ln"></div>
<p><b>Customer:</b> ${receipt.customer.name}<br>
<b>Date:</b> ${receipt.date.toLocaleString()}</p>
<div class="ln"></div>
<table>${receipt.items.map(i => `
<tr><td>${i.name}</td><td class="r">${i.quantity} × ₱${i.price.toFixed(2)}</td></tr>
<tr><td></td><td class="r">₱${i.subtotal.toFixed(2)}</td></tr>`).join('')}
</table>
<div class="ln"></div>
<table>
<tr><td><b>TOTAL</b></td><td class="r"><b>₱${receipt.totalAmount.toFixed(2)}</b></td></tr>
</table>
<div class="ln"></div>
<p style="text-align:center">Thank you! Status: PENDING</p>
<div class="btn noprint">
  <button onclick="window.print()">🖨 Print</button>
  <button onclick="window.close()">Close</button>
</div>
</body></html>`);
    w.document.close();
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:'100%' }}>
      <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleBarcodeScan} title="Scan Product Barcode" />

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:9999,
          background:'rgba(231,74,59,0.95)', color:'var(--text-primary)', padding:'10px 18px', borderRadius:8,
          fontSize:13, boxShadow:'0 4px 12px rgba(0,0,0,0.4)', whiteSpace:'nowrap', maxWidth:'90vw',
          overflow:'hidden', textOverflow:'ellipsis',
        }}>{toast}</div>
      )}

      {/* Two-column layout: info + cart */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:14, alignItems:'start' }}>

        {/* Left — Customer + Product */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Customer */}
          <div style={card}>
            <p style={{ color:'var(--text-primary)', fontWeight:700, margin:'0 0 14px', fontSize:14 }}>Customer</p>

            {/* Name with autocomplete */}
            <div style={{ marginBottom:10, position:'relative' }}>
              <label style={lbl}>Name *</label>
              <div style={{ position:'relative' }}>
                <input ref={custInputRef} value={customerName}
                  onChange={e => { setCustomerName(e.target.value); setSelectedCustomer(null); }}
                  placeholder="Search or type new name…" style={iStyle}
                  onFocus={focusIn} onBlur={focusOut} />
                {selectedCustomer && (
                  <button onClick={clearCustomer} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--wa-4)', cursor:'pointer', padding:4 }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              {custSuggestions.length > 0 && (
                <div style={{ position:'absolute', zIndex:200, background:'var(--surface-2)', border:'1px solid var(--wa-1)', borderRadius:10, width:'100%', maxHeight:180, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                  {custSuggestions.map(c => (
                    <div key={c.id} onClick={() => selectCustomer(c)}
                      style={{ padding:'9px 12px', cursor:'pointer', borderBottom:'1px solid var(--wa-05)', color:'var(--text-primary)', fontSize:13 }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(78,115,223,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div style={{ fontWeight:600 }}>{c.name}</div>
                      {c.phone && <div style={{ color:'var(--wa-4)', fontSize:11 }}>{c.phone}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <label style={lbl}>Phone</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Optional" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Optional" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
          </div>

          {/* Add Product */}
          <div style={card}>
            <p style={{ color:'var(--text-primary)', fontWeight:700, margin:'0 0 14px', fontSize:14 }}>Add Product</p>

            <div style={{ marginBottom:10, position:'relative' }}>
              <label style={lbl}>Search by name or barcode</label>
              <div style={{ position:'relative' }}>
                <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--wa-35)' }} />
                <input ref={productInputRef} value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                  placeholder="Product name or code…"
                  style={{ ...iStyle, paddingLeft:32, paddingRight:44 }}
                  onFocus={focusIn} onBlur={focusOut} />
                <button onClick={() => setScannerOpen(true)} style={{
                  position:'absolute', right:6, top:'50%', transform:'translateY(-50%)',
                  background:'rgba(78,115,223,0.2)', border:'none', borderRadius:7,
                  color:'#4e73df', cursor:'pointer', padding:'5px 7px', display:'flex', alignItems:'center',
                }} title="Scan barcode">
                  <Barcode size={15} />
                </button>
              </div>
              {productSuggestions.length > 0 && (
                <div style={{ position:'absolute', zIndex:200, background:'var(--surface-2)', border:'1px solid var(--wa-1)', borderRadius:10, width:'100%', maxHeight:220, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                  {productSuggestions.map(p => {
                    const price = p.retailPrice || p.price || 0;
                    return (
                      <div key={p.id} onClick={() => selectProduct(p)}
                        style={{ padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid var(--wa-05)', color:'var(--text-primary)', fontSize:13 }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(78,115,223,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div style={{ display:'flex', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                          <span style={{ fontWeight:600 }}>{p.name}
                            <span style={{ color:'var(--wa-35)', fontSize:11, marginLeft:6 }}>{p.productCode}</span>
                          </span>
                          <span style={{ color:'#1cc88a', fontWeight:700 }}>₱{price.toFixed(2)}</span>
                        </div>
                        <div style={{ color:(p.stock||0)===0?'#e74a3b':'var(--wa-4)', fontSize:11, marginTop:2 }}>
                          Stock: {p.stock||0}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected product preview */}
            {selectedProduct && (
              <div style={{ background:'rgba(78,115,223,0.1)', border:'1px solid rgba(78,115,223,0.3)', borderRadius:9, padding:'9px 11px', marginBottom:10, fontSize:13 }}>
                <div style={{ color:'var(--text-primary)', fontWeight:600 }}>{selectedProduct.name}</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:3, flexWrap:'wrap', gap:6 }}>
                  <span style={{ color:'var(--wa-5)' }}>₱{(selectedProduct.retailPrice||selectedProduct.price||0).toFixed(2)}</span>
                  <span style={{ color:(selectedProduct.stock||0)===0?'#e74a3b':'#1cc88a' }}>Stock: {selectedProduct.stock||0}</span>
                </div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'end' }}>
              <div>
                <label style={lbl}>Quantity</label>
                <input type="number" min="1" value={qty}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '') { setQty(''); return; }
                    const n = parseInt(v);
                    if (!isNaN(n)) setQty(n);
                  }}
                  onBlur={e => { focusOut(e); if (qty === '' || qty < 1) setQty(1); }}
                  style={iStyle} onFocus={focusIn} />
              </div>
              <button onClick={addToCart} style={{
                padding:'11px 18px', background:'linear-gradient(135deg,#4e73df,#224abe)',
                border:'none', borderRadius:10, color:'var(--text-primary)', fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', gap:6, fontSize:14, whiteSpace:'nowrap',
              }}>
                <Plus size={15} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Right — Cart */}
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <p style={{ color:'var(--text-primary)', fontWeight:700, margin:0, display:'flex', alignItems:'center', gap:6, fontSize:14 }}>
              <ShoppingCart size={15} color="#4e73df" />
              Cart {totalItems > 0 && <span style={{ background:'rgba(78,115,223,0.2)', color:'#4e73df', borderRadius:20, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{totalItems}</span>}
            </p>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} style={{ background:'rgba(231,74,59,0.15)', border:'none', borderRadius:7, color:'#e74a3b', cursor:'pointer', padding:'5px 10px', fontSize:12, fontWeight:600 }}>
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--wa-2)' }}>
              <ShoppingCart size={36} style={{ marginBottom:10, opacity:.3 }} />
              <p style={{ margin:0, fontSize:13 }}>Cart is empty</p>
              <p style={{ margin:'5px 0 0', fontSize:11 }}>Scan a barcode or search above</p>
            </div>
          ) : (
            <>
              {/* Cart items — scrollable on mobile */}
              <div style={{ overflowX:'auto', marginBottom:12 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:360 }}>
                  <thead>
                    <tr>
                      {['Product','Price','Qty','Sub',''].map((h, i) => (
                        <th key={i} style={{ color:'var(--wa-4)', fontWeight:600, textAlign: i===1||i===3?'right':'left', padding:'5px 8px', borderBottom:'1px solid var(--wa-07)', fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom:'1px solid var(--wa-04)' }}>
                        <td style={{ padding:'8px', color:'var(--text-primary)' }}>{item.name}</td>
                        <td style={{ padding:'8px', color:'var(--wa-6)', textAlign:'right', whiteSpace:'nowrap' }}>₱{item.price.toFixed(2)}</td>
                        <td style={{ padding:'8px', textAlign:'center' }}>
                          <input type="number" min="1" value={item.quantity}
                            onChange={e => {
                              const v = e.target.value;
                              if (v === '') {
                                setCart(cart.map((it, i) => i === idx ? { ...it, quantity: '' } : it));
                                return;
                              }
                              const n = parseInt(v);
                              if (!isNaN(n)) updateQty(idx, n);
                            }}
                            onBlur={e => { focusOut(e); if (item.quantity === '' || item.quantity < 1) updateQty(idx, 1); }}
                            style={{ ...iStyle, width:54, padding:'5px 6px', textAlign:'center' }}
                            onFocus={focusIn} />
                        </td>
                        <td style={{ padding:'8px', color:'#1cc88a', fontWeight:700, textAlign:'right', whiteSpace:'nowrap' }}>₱{item.subtotal.toFixed(2)}</td>
                        <td style={{ padding:'8px' }}>
                          <button onClick={() => removeFromCart(idx)} style={{ background:'rgba(231,74,59,0.15)', border:'none', borderRadius:6, color:'#e74a3b', cursor:'pointer', padding:'4px 6px', display:'flex', alignItems:'center' }}>
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div style={{ borderTop:'1px solid var(--wa-07)', paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ color:'var(--text-primary)', fontWeight:700, fontSize:15 }}>TOTAL</span>
                <span style={{ color:'#1cc88a', fontWeight:800, fontSize:20 }}>₱{cartTotal.toFixed(2)}</span>
              </div>

              <button onClick={finalizePurchase} disabled={finalizing} style={{
                width:'100%', padding:'13px',
                background: finalizing ? 'rgba(28,200,138,0.4)' : 'linear-gradient(135deg,#1cc88a,#17a673)',
                border:'none', borderRadius:11, color:'var(--text-primary)', fontWeight:700,
                cursor: finalizing ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:15,
                boxShadow:'0 6px 18px rgba(28,200,138,0.3)',
              }}>
                <CheckCircle size={17} />
                {finalizing ? 'Processing…' : 'Finalize Purchase'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'var(--nav-bg)', borderRadius:16, padding:22, maxWidth:420, width:'100%', border:'1px solid var(--wa-1)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <CheckCircle size={44} color="#1cc88a" style={{ marginBottom:8 }} />
              <h4 style={{ color:'var(--text-primary)', margin:0 }}>Purchase Complete!</h4>
              <p style={{ color:'var(--wa-45)', margin:'4px 0 0', fontSize:12 }}>Status: <b style={{ color:'#f6c23e' }}>PENDING</b></p>
            </div>
            <div style={{ background:'var(--wa-04)', borderRadius:11, padding:14, marginBottom:14 }}>
              <div style={{ color:'var(--wa-55)', fontSize:13, marginBottom:8 }}>
                Customer: <b style={{ color:'var(--text-primary)' }}>{receipt.customer.name}</b>
              </div>
              {receipt.items.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--wa-7)', marginBottom:4, flexWrap:'wrap', gap:4 }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>₱{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px dashed var(--wa-15)', marginTop:10, paddingTop:10, display:'flex', justifyContent:'space-between' }}>
                <b style={{ color:'var(--text-primary)' }}>TOTAL</b>
                <b style={{ color:'#1cc88a', fontSize:16 }}>₱{receipt.totalAmount.toFixed(2)}</b>
              </div>
            </div>
            {bluetoothSupported ? (
              <button onClick={printBluetoothReceipt} disabled={printing} style={{
                width:'100%', padding:11, marginBottom:8,
                background: printerStatus === 'connected' ? 'rgba(28,200,138,0.18)' : 'linear-gradient(135deg,#4e73df,#224abe)',
                border: printerStatus === 'connected' ? '1px solid rgba(28,200,138,0.35)' : 'none',
                borderRadius:9, color: printerStatus === 'connected' ? '#1cc88a' : 'var(--text-primary)', fontWeight:700, cursor: printing ? 'not-allowed' : 'pointer', fontSize:14,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                {printerStatus === 'connected' ? <BluetoothConnected size={15}/> : <Bluetooth size={15}/>}
                {printing ? 'Printing…' : printerStatus === 'connected' ? `Print to ${printerName}` : 'Print to Thermal Printer'}
              </button>
            ) : (
              <p style={{ color:'var(--wa-35)', fontSize:11, textAlign:'center', marginBottom:8 }}>
                Direct Bluetooth printing needs Chrome (Android/desktop) — use browser print below instead.
              </p>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={printReceipt} style={{ flex:1, padding:11, background:'var(--wa-08)', border:'none', borderRadius:9, color:'var(--text-primary)', fontWeight:600, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Printer size={13}/> Browser Print
              </button>
              <button onClick={() => setReceipt(null)} style={{ flex:1, padding:11, background:'var(--wa-08)', border:'none', borderRadius:9, color:'var(--text-primary)', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
