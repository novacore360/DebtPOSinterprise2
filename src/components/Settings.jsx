// src/components/Settings.jsx
import React, { useState } from 'react';
import { Download, Upload, Database, User, LogOut, TrendingUp, Infinity, AlertCircle, Bluetooth, BluetoothConnected, BluetoothOff, Printer, Sun, Moon } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { usePrinter } from '../context/PrinterContext';
import { useTheme } from '../context/ThemeContext';
import { ReceiptBuilder } from '../utils/escpos';

const iStyle = { width:'100%', padding:'10px 12px', background:'var(--wa-06)', border:'1px solid var(--wa-1)', borderRadius:9, color:'var(--text-primary)', fontSize:14, outline:'none', boxSizing:'border-box' };
const lbl  = { color:'var(--wa-55)', fontSize:12, marginBottom:5, display:'block', fontWeight:600 };

const card = { background:'var(--wa-03)', border:'1px solid var(--wa-07)', borderRadius:14, padding:20 };

export default function Settings({ products, customers, purchases, user, logout, updateProduct }) {
  const { theme, setTheme } = useTheme();
  const { isSupported: bluetoothSupported, status: printerStatus, printerName, error: printerError, connect: connectPrinter, disconnect: disconnectPrinter, print: sendToPrinter, storeInfo, updateStoreInfo } = usePrinter();
  const [testPrinting, setTestPrinting] = useState(false);
  const [infinityLoading, setInfinityLoading] = useState(false);
  const [infinityMessage, setInfinityMessage] = useState(null);

  const testPrint = async () => {
    setTestPrinting(true);
    try {
      const b = new ReceiptBuilder(storeInfo.paperWidth || 32);
      b.init().align('center').bold(true).size(2,2).text(storeInfo.name || 'Marnie Store').newline();
      b.bold(false).size(1,1).text('Test Print').newline();
      b.text(new Date().toLocaleString()).newline();
      b.line('-').align('left').text('If you can read this,').newline().text('your printer is connected').newline().text('correctly.').newline();
      b.feed(3).cut(true);
      const ok = await sendToPrinter(b.build());
      if (!ok) window.alert('Test print failed: ' + (printerError || 'unknown error'));
    } catch (err) {
      window.alert('Test print failed: ' + err.message);
    } finally {
      setTestPrinting(false);
    }
  };

  const exportData = () => {
    const data = { products, customers, purchases, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `marnie_pos_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        alert(`Import preview:\n• ${data.products?.length||0} products\n• ${data.customers?.length||0} customers\n• ${data.purchases?.length||0} purchases\n\nNote: To import, push each record to Firestore via the admin panel.`);
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  // Direct Firestore update - most reliable method
  const lowStockProducts = products.filter(p => (p.stock || 0) < 50);

  const setInfiniteStock = async () => {
    if (lowStockProducts.length === 0) return;
    if (!window.confirm(`⚠️ Set infinite stock for ${lowStockProducts.length} low-stock product(s) (below 50 units)?\n\nThis will set their stock to 999,999 units. This cannot be undone easily.`)) return;
    
    setInfinityLoading(true);
    setInfinityMessage(null);
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    // Log for debugging
    console.log(`Starting to update ${lowStockProducts.length} low-stock products...`);
    
    for (let i = 0; i < lowStockProducts.length; i++) {
      const product = lowStockProducts[i];
      try {
        // Validate product has an ID
        if (!product.id) {
          throw new Error('Product has no ID');
        }
        
        console.log(`Updating ${i + 1}/${lowStockProducts.length}: ${product.name}`);
        
        // Direct Firestore update using document reference
        const productRef = doc(db, 'products', product.id);
        await updateDoc(productRef, { 
          stock: 999999,
          updatedAt: new Date().toISOString()
        });
        
        successCount++;
        console.log(`✓ Updated: ${product.name}`);
        
      } catch (err) {
        failCount++;
        const errorMsg = err.message || 'Unknown error';
        errors.push(`${product.name}: ${errorMsg}`);
        console.error(`✗ Failed to update ${product.name}:`, err);
      }
    }
    
    console.log(`Update complete: ${successCount} succeeded, ${failCount} failed`);
    
    if (errors.length > 0) {
      setInfinityMessage({ 
        success: successCount, 
        fail: failCount, 
        errors: errors.slice(0, 3) 
      });
    } else {
      setInfinityMessage({ success: successCount, fail: failCount });
    }
    
    setTimeout(() => setInfinityMessage(null), 5000);
    setInfinityLoading(false);
  };

  const totalSales   = purchases.reduce((s,p) => s+(p.total_amount||0), 0);
  const paidSales    = purchases.filter(p=>p.status==='paid').reduce((s,p)=>s+(p.total_amount||0),0);
  const pendingCount = purchases.filter(p=>p.status!=='paid').length;

  // profit from product_data items
  const totalProfit = purchases.reduce((s, p) => {
    const items = p.product_data || [];
    return s + items.reduce((ss, item) => ss + (item.subtotal - (item.cost_price||0)*item.quantity), 0);
  }, 0);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>

      {/* Appearance */}
      <div style={card}>
        <h6 style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
          {theme === 'dark' ? <Moon size={15} color="#4e73df" /> : <Sun size={15} color="#4e73df" />} Appearance
        </h6>
        <p style={{ color:'var(--wa-45)', fontSize:13, marginBottom:14, lineHeight:1.5 }}>
          Switch between dark and light mode. Your choice is saved on this device.
        </p>
        <div style={{ display:'flex', gap:9, background:'var(--wa-06)', border:'1px solid var(--wa-1)', borderRadius:11, padding:4 }}>
          <button
            onClick={() => setTheme('dark')}
            style={{
              flex:1, padding:'10px 14px', borderRadius:8, border:'none', cursor:'pointer',
              fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              background: theme === 'dark' ? 'linear-gradient(135deg,#4e73df,#224abe)' : 'transparent',
              color: theme === 'dark' ? '#ffffff' : 'var(--wa-5)',
              transition:'background 0.15s, color 0.15s',
            }}
          >
            <Moon size={14} /> Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            style={{
              flex:1, padding:'10px 14px', borderRadius:8, border:'none', cursor:'pointer',
              fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              background: theme === 'light' ? 'linear-gradient(135deg,#4e73df,#224abe)' : 'transparent',
              color: theme === 'light' ? '#ffffff' : 'var(--wa-5)',
              transition:'background 0.15s, color 0.15s',
            }}
          >
            <Sun size={14} /> Light
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div style={card}>
        <h6 style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
          <Database size={15} color="#4e73df" /> Data Management
        </h6>
        <p style={{ color:'var(--wa-45)', fontSize:13, marginBottom:14, lineHeight:1.5 }}>
          Export your data as a JSON backup or inspect a previously exported file.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          <button onClick={exportData} style={{ padding:'11px 14px', background:'rgba(78,115,223,0.15)', border:'1px solid rgba(78,115,223,0.3)', borderRadius:9, color:'#4e73df', cursor:'pointer', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
            <Download size={15} /> Export JSON Backup
          </button>
          <label style={{ padding:'11px 14px', background:'rgba(28,200,138,0.15)', border:'1px solid rgba(28,200,138,0.3)', borderRadius:9, color:'#1cc88a', cursor:'pointer', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
            <Upload size={15} /> Import / Inspect JSON
            <input type="file" accept=".json" onChange={handleImport} style={{ display:'none' }} />
          </label>
        </div>
      </div>

      {/* Thermal Printer */}
      <div style={card}>
        <h6 style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
          <Printer size={15} color="#4e73df" /> Thermal Printer (Bluetooth)
        </h6>

        {!bluetoothSupported ? (
          <p style={{ color:'#f6c23e', fontSize:12.5, lineHeight:1.6 }}>
            <AlertCircle size={12} style={{ display:'inline', marginRight:4 }} />
            Web Bluetooth isn't available in this browser. Open this app in Chrome on Android or desktop to print directly to a Bluetooth thermal printer.
          </p>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'9px 12px', borderRadius:9, background: printerStatus==='connected' ? 'rgba(28,200,138,0.1)' : 'var(--wa-04)' }}>
              {printerStatus === 'connected' ? <BluetoothConnected size={16} color="#1cc88a" /> : printerStatus === 'connecting' ? <Bluetooth size={16} color="#f6c23e" /> : <BluetoothOff size={16} color="var(--wa-4)" />}
              <span style={{ fontSize:13, color: printerStatus==='connected' ? '#1cc88a' : 'var(--wa-55)' }}>
                {printerStatus === 'connected' ? `Connected: ${printerName}` : printerStatus === 'connecting' ? 'Connecting…' : 'Not connected'}
              </span>
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              {printerStatus === 'connected' ? (
                <button onClick={disconnectPrinter} style={{ flex:1, padding:'10px 12px', background:'rgba(231,74,59,0.15)', border:'1px solid rgba(231,74,59,0.3)', borderRadius:9, color:'#e74a3b', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                  Disconnect
                </button>
              ) : (
                <button onClick={connectPrinter} disabled={printerStatus==='connecting'} style={{ flex:1, padding:'10px 12px', background:'linear-gradient(135deg,#4e73df,#224abe)', border:'none', borderRadius:9, color:'var(--text-primary)', cursor: printerStatus==='connecting'?'not-allowed':'pointer', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Bluetooth size={14} /> {printerStatus==='connecting' ? 'Connecting…' : 'Pair Printer'}
                </button>
              )}
              <button onClick={testPrint} disabled={testPrinting} style={{ flex:1, padding:'10px 12px', background:'var(--wa-08)', border:'none', borderRadius:9, color:'var(--text-primary)', cursor: testPrinting?'not-allowed':'pointer', fontWeight:600, fontSize:13 }}>
                {testPrinting ? 'Printing…' : 'Test Print'}
              </button>
            </div>
            {printerError && (
              <p style={{ color:'#e74a3b', fontSize:11.5, marginBottom:14 }}>{printerError}</p>
            )}
            <p style={{ color:'var(--wa-35)', fontSize:11, marginBottom:14, lineHeight:1.5 }}>
              Works with generic 58mm/80mm Bluetooth LE thermal printers — no separate printer app needed. Tap "Pair Printer" once per session and pick your printer from the browser's device list.
            </p>

            <div style={{ borderTop:'1px solid var(--wa-06)', paddingTop:14 }}>
              <p style={{ color:'var(--wa-5)', fontSize:12, fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:.4 }}>Receipt Details</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Store Name</label>
                  <input style={iStyle} value={storeInfo.name} onChange={e => updateStoreInfo({ name: e.target.value })} />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Address (optional)</label>
                  <input style={iStyle} value={storeInfo.address} onChange={e => updateStoreInfo({ address: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Phone (optional)</label>
                  <input style={iStyle} value={storeInfo.phone} onChange={e => updateStoreInfo({ phone: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Paper Width</label>
                  <select style={iStyle} value={storeInfo.paperWidth} onChange={e => updateStoreInfo({ paperWidth: Number(e.target.value) })}>
                    <option value={32}>58mm (32 chars)</option>
                    <option value={48}>80mm (48 chars)</option>
                  </select>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Receipt Footer Message</label>
                  <input style={iStyle} value={storeInfo.footer} onChange={e => updateStoreInfo({ footer: e.target.value })} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Account */}
      <div style={card}>
        <h6 style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
          <User size={15} color="#4e73df" /> Account & System
        </h6>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {[
            { label:'System',      value:'Marnie Store POS v2.1' },
            { label:'Database',    value:'Firebase Firestore' },
            { label:'Logged in as', value: user?.email||'Unknown', color:'#4e73df' },
            { label:'Status',      value:'● Connected', color:'#1cc88a' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--wa-05)', gap:8, flexWrap:'wrap' }}>
              <span style={{ color:'var(--wa-45)', fontSize:13 }}>{label}</span>
              <span style={{ color: color||'var(--text-primary)', fontWeight:500, fontSize:13, wordBreak:'break-all' }}>{value}</span>
            </div>
          ))}
        </div>
        <button onClick={logout} style={{ marginTop:14, width:'100%', padding:11, background:'rgba(231,74,59,0.15)', border:'1px solid rgba(231,74,59,0.3)', borderRadius:9, color:'#e74a3b', cursor:'pointer', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* Infinite Stock Card */}
      <div style={{ ...card, borderColor: '#4e73df30' }}>
        <h6 style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
          <Infinity size={15} color="#4e73df" /> Stock Management
        </h6>
        <p style={{ color:'var(--wa-45)', fontSize:13, marginBottom:14, lineHeight:1.5 }}>
          Set infinite stock (999,999 units) only for products that are running low (below 50 units). Products with healthy stock are left untouched.
        </p>
        
        {infinityMessage && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 9,
            marginBottom: 14,
            background: infinityMessage.fail > 0 ? 'rgba(231,74,59,0.12)' : 'rgba(28,200,138,0.12)',
            border: `1px solid ${infinityMessage.fail > 0 ? 'rgba(231,74,59,0.3)' : 'rgba(28,200,138,0.3)'}`,
            fontSize: 12,
            color: infinityMessage.fail > 0 ? '#e74a3b' : '#1cc88a',
          }}>
            {infinityMessage.fail > 0 
              ? `⚠️ ${infinityMessage.success} updated, ${infinityMessage.fail} failed. Check console (F12) for details.`
              : `✅ All ${infinityMessage.success} products set to infinite stock!`}
            {infinityMessage.errors && infinityMessage.errors.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 10, opacity: 0.8, wordBreak: 'break-word' }}>
                First error: {infinityMessage.errors[0]}
              </div>
            )}
          </div>
        )}
        
        <button 
          onClick={setInfiniteStock} 
          disabled={infinityLoading || lowStockProducts.length === 0}
          style={{ 
            width:'100%', 
            padding:'11px 14px', 
            background: infinityLoading || lowStockProducts.length === 0 
              ? 'rgba(78,115,223,0.3)' 
              : 'linear-gradient(135deg, #4e73df, #224abe)',
            border:'none', 
            borderRadius:9, 
            color:'var(--text-primary)', 
            cursor: (infinityLoading || lowStockProducts.length === 0) ? 'not-allowed' : 'pointer', 
            fontWeight:600, 
            fontSize:14, 
            display:'flex', 
            alignItems:'center', 
            justifyContent:'center', 
            gap:8 
          }}>
          {infinityLoading ? (
            <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid var(--wa-3)', borderTopColor:'var(--text-primary)', animation:'spin 0.8s linear infinite' }} />
          ) : (
            <Infinity size={15} />
          )}
          {infinityLoading ? `Updating ${Math.floor(Math.random() * 100)}%...` : `Set Infinite Stock for ${lowStockProducts.length} Low-Stock Product${lowStockProducts.length === 1 ? '' : 's'}`}
        </button>
        
        {lowStockProducts.length === 0 && (
          <p style={{ color:'rgba(28,200,138,0.7)', fontSize:11, marginTop:10, textAlign:'center' }}>
            <AlertCircle size={11} style={{ display:'inline', marginRight:4 }} />
            No products below 50 stock — nothing to update
          </p>
        )}
        
        {/* Debug info */}
        <details style={{ marginTop: 12, fontSize: 11, color: 'var(--wa-3)' }}>
          <summary>Debug Info</summary>
          <div style={{ marginTop: 8 }}>
            Products count: {products.length}
            <br />
            Sample product ID: {products[0]?.id || 'None'}
            <br />
            User logged in: {user?.email || 'No'}
          </div>
        </details>
      </div>

      {/* Financial Summary */}
      <div style={{ ...card, gridColumn:'1 / -1' }}>
        <h6 style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
          <TrendingUp size={15} color="#1cc88a" /> Financial Summary
        </h6>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:12 }}>
          {[
            { label:'Total Revenue',  value:`₱${totalSales.toFixed(2)}`,   color:'#4e73df' },
            { label:'Paid Revenue',   value:`₱${paidSales.toFixed(2)}`,    color:'#1cc88a' },
            { label:'Total Profit',   value:`₱${totalProfit.toFixed(2)}`,  color:'#1cc88a' },
            { label:'Profit Margin',  value: totalSales>0 ? `${((totalProfit/totalSales)*100).toFixed(1)}%` : '0%', color:'#f6c23e' },
            { label:'Total Orders',   value: purchases.length,             color:'#36b9cc' },
            { label:'Pending Orders', value: pendingCount,                 color:'#f6c23e' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:'var(--wa-04)', borderRadius:10, padding:'13px 14px', textAlign:'center' }}>
              <div style={{ color:'var(--wa-4)', fontSize:11, textTransform:'uppercase', letterSpacing:.4 }}>{label}</div>
              <div style={{ color, fontWeight:800, fontSize:20, marginTop:5 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
