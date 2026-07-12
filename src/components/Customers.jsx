import React, { useState } from 'react';
import { Search, Edit2, Trash2, ChevronDown, ChevronUp, CheckCircle, Clock, X, KeyRound, PackageX, Bluetooth, BluetoothConnected } from 'lucide-react';
import CustomerPasswords from './CustomerPasswords';
import { usePrinter } from '../context/PrinterContext';
import { buildCustomerReport, buildPurchaseReceipt } from '../utils/receiptTemplates';

const iStyle = { width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box' };
const focusIn  = e => { e.target.style.borderColor='#4e73df'; e.target.style.boxShadow='0 0 0 2px rgba(78,115,223,0.2)'; };
const focusOut = e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; };
const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:16 };
const lbl  = { color:'rgba(255,255,255,0.55)', fontSize:12, marginBottom:5, display:'block', fontWeight:600 };

export default function Customers({ customers, purchases, updateCustomer, deleteCustomer, updatePurchase, deletePurchase, deletePurchasesByCustomer }) {
  const { print, status: printerStatus, printerName, error: printerError, isSupported: bluetoothSupported, storeInfo } = usePrinter();
  const [printing, setPrinting] = useState(false);
  const [search, setSearch]     = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [view, setView] = useState('list'); // 'list' | 'passwords'

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  // Suggestions dropdown shown under the search box as the user types
  const suggestions = search.trim()
    ? customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)).slice(0, 6)
    : [];

  const selected = customers.find(c => c.id === expandedId);
  // Uses customer_id field from purchases (exact Firebase structure)
  const custPurchases = purchases.filter(p => p.customer_id === expandedId);
  const totalSpent = custPurchases.reduce((s, p) => s + (p.total_amount||0), 0);

  const startEdit = () => {
    setEditData({ name: selected.name, phone: selected.phone||'', email: selected.email||'' });
    setEditMode(true);
  };
  const saveEdit = async () => { await updateCustomer(expandedId, editData); setEditMode(false); };
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selected.name}" and all their purchases?`)) return;
    await deleteCustomer(expandedId); setExpandedId(null); setEditMode(false);
  };
  const handleMarkPaid = async p => {
    await updatePurchase(p.id, { status: p.status === 'paid' ? 'pending' : 'paid' });
  };
  const handleDeletePurchase = async id => {
    if (!window.confirm('Delete this purchase?')) return;
    await deletePurchase(id);
  };
  const reprintPurchase = async (p) => {
    setPrinting(true);
    try {
      const bytes = buildPurchaseReceipt({
        storeInfo,
        customer: { name: p.customer_name || selected?.name, phone: selected?.phone },
        items: (p.product_data || []).map(i => ({ name: i.name, price: i.price, quantity: i.quantity, subtotal: i.subtotal })),
        totalAmount: p.total_amount,
        date: p.purchase_date,
        status: p.status || 'pending',
      });
      const ok = await print(bytes);
      window.alert(ok ? 'Receipt sent to printer ✓' : 'Could not print: ' + (printerError || 'connection failed'));
    } catch (err) {
      window.alert('Print failed: ' + err.message);
    } finally {
      setPrinting(false);
    }
  };
  const handleDeleteAllPurchases = async () => {
    if (!selected) return;
    if (custPurchases.length === 0) { window.alert('This customer has no purchases to delete.'); return; }
    if (!window.confirm(`Delete ALL ${custPurchases.length} purchase(s) for "${selected.name}"? The customer will NOT be deleted, only their purchase history.`)) return;
    await deletePurchasesByCustomer(expandedId);
  };

  const printReport = () => {
    if (!selected) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report</title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  *{box-sizing:border-box}
  html,body{margin:0;width:100%}
  body{font-family:Arial,sans-serif;padding:16px;color:#333;max-width:800px;margin:0 auto}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;word-break:break-word}
  th{background:#f5f5f5}
  .noprint{display:flex;gap:10px;margin-top:16px}
  .noprint button{flex:1;padding:12px;font-size:15px;border:1px solid #ccc;border-radius:8px;background:#f5f5f5}
  @media (max-width:480px){
    body{padding:10px;font-size:13px}
    th,td{padding:5px;font-size:11px}
  }
  @media print{.noprint{display:none}}
</style>
</head><body>
<h2>Marnie Store — Customer Report</h2>
<p><b>${selected.name}</b> | ${selected.phone||'No phone'} | ${selected.email||'No email'}</p>
<table><thead><tr><th>Date</th><th>Items</th><th>Amount</th></tr></thead>
<tbody>${custPurchases.map(p=>`<tr>
<td>${new Date(p.purchase_date).toLocaleDateString()}</td>
<td>${(p.product_data||[]).map(i=>`${i.name} (₱${(i.price||0).toFixed(2)}) ×${i.quantity}`).join(', ')}</td>
<td>₱${(p.total_amount||0).toFixed(2)}</td></tr>`).join('')}
</tbody></table>
<p><b>Total Spent: ₱${totalSpent.toFixed(2)}</b></p>
<div class="noprint"><button onclick="window.print()">Print</button><button onclick="window.close()">Close</button></div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const printBluetoothReport = async () => {
    if (!selected) return;
    setPrinting(true);
    try {
      const bytes = buildCustomerReport({ storeInfo, customer: selected, purchases: custPurchases });
      const ok = await print(bytes);
      window.alert(ok ? 'Report sent to printer ✓' : 'Could not print: ' + (printerError || 'connection failed'));
    } catch (err) {
      window.alert('Print failed: ' + err.message);
    } finally {
      setPrinting(false);
    }
  };

  if (view === 'passwords') {
    return (
      <CustomerPasswords
        customers={customers}
        updateCustomer={updateCustomer}
        onBack={() => setView('list')}
      />
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
        <div>
          <h2 style={{ color:'#fff', margin:0, fontSize:18, fontWeight:700 }}>Customers</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', margin:'2px 0 0', fontSize:12 }}>{customers.length} registered customers</p>
        </div>
        <button onClick={() => setView('passwords')} style={{ padding:'8px 12px', background:'rgba(78,115,223,0.15)', border:'1px solid rgba(78,115,223,0.3)', borderRadius:8, color:'#4e73df', cursor:'pointer', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', flexShrink:0 }}>
          <KeyRound size={13} /> Passwords
        </button>
      </div>

      {/* Search with suggestions */}
      <div style={{ position:'relative' }}>
        <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)' }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search name or phone…"
          style={{ ...iStyle, paddingLeft:36 }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, overflow:'hidden', zIndex:20, boxShadow:'0 10px 24px rgba(0,0,0,0.45)' }}>
            {suggestions.map(c => (
              <div
                key={c.id}
                onMouseDown={() => { setSearch(c.name || ''); setShowSuggestions(false); }}
                style={{ padding:'9px 12px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.05)' }}
              >
                <span style={{ color:'#fff', fontSize:13 }}>{c.name}</span>
                <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>{c.phone || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer list */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 16px', color:'rgba(255,255,255,0.2)', fontSize:14 }}>No customers found.</div>
        )}
        {filtered.map(c => {
          const isOpen = expandedId === c.id;
          const cPurchases = purchases.filter(p => p.customer_id === c.id);
          const spent = cPurchases.reduce((s, p) => s+(p.total_amount||0), 0);
          return (
            <div key={c.id} style={{ ...card, padding:0, overflow:'hidden' }}>
              {/* Row */}
              <div onClick={() => { setExpandedId(isOpen ? null : c.id); setEditMode(false); }}
                style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 14px', cursor:'pointer', gap:10, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,rgba(78,115,223,0.3),rgba(28,200,138,0.3))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ color:'#fff', fontWeight:800, fontSize:14 }}>{c.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:1 }}>{c.phone||c.email||'No contact'}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ color:'#1cc88a', fontWeight:700, fontSize:13 }}>₱{spent.toFixed(2)}</div>
                    <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>{cPurchases.length} orders</div>
                  </div>
                  {isOpen ? <ChevronUp size={14} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.4)" />}
                </div>
              </div>

              {/* Expanded */}
              {isOpen && selected && (
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:14 }}>
                  {!editMode ? (
                    <>
                      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                        <button onClick={startEdit} style={{ padding:'7px 12px', background:'rgba(78,115,223,0.15)', border:'1px solid rgba(78,115,223,0.3)', borderRadius:8, color:'#4e73df', cursor:'pointer', fontWeight:600, fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={printReport} style={{ padding:'7px 12px', background:'rgba(54,185,204,0.15)', border:'1px solid rgba(54,185,204,0.3)', borderRadius:8, color:'#36b9cc', cursor:'pointer', fontWeight:600, fontSize:12 }}>
                          🖨 Report
                        </button>
                        {bluetoothSupported && (
                          <button onClick={printBluetoothReport} disabled={printing} style={{ padding:'7px 12px', background: printerStatus==='connected' ? 'rgba(28,200,138,0.15)' : 'rgba(78,115,223,0.15)', border: printerStatus==='connected' ? '1px solid rgba(28,200,138,0.3)' : '1px solid rgba(78,115,223,0.3)', borderRadius:8, color: printerStatus==='connected' ? '#1cc88a' : '#4e73df', cursor: printing?'not-allowed':'pointer', fontWeight:600, fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                            {printerStatus === 'connected' ? <BluetoothConnected size={12}/> : <Bluetooth size={12}/>}
                            {printing ? 'Printing…' : printerStatus === 'connected' ? `Print (${printerName})` : 'Thermal Print'}
                          </button>
                        )}
                        <button onClick={handleDelete} style={{ padding:'7px 12px', background:'rgba(231,74,59,0.15)', border:'1px solid rgba(231,74,59,0.3)', borderRadius:8, color:'#e74a3b', cursor:'pointer', fontWeight:600, fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                          <Trash2 size={12} /> Delete Customer
                        </button>
                        <button onClick={handleDeleteAllPurchases} style={{ padding:'7px 12px', background:'rgba(246,194,62,0.15)', border:'1px solid rgba(246,194,62,0.3)', borderRadius:8, color:'#f6c23e', cursor:'pointer', fontWeight:600, fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                          <PackageX size={12} /> Delete Purchases
                        </button>
                      </div>

                      {/* Purchases list */}
                      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600, marginBottom:8, textTransform:'uppercase', letterSpacing:.4 }}>Purchase History</p>
                      {custPurchases.length === 0 ? (
                        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:13, textAlign:'center', padding:'16px 0' }}>No purchases yet.</p>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {custPurchases.map(p => (
                            <div key={p.id} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                                <div>
                                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{new Date(p.purchase_date).toLocaleString()}</div>
                                  <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:3 }}>
                                    {(p.product_data||[]).map(i => `${i.name} ×${i.quantity}`).join(', ')}
                                  </div>
                                </div>
                                <div style={{ textAlign:'right', flexShrink:0 }}>
                                  <div style={{ color:'#1cc88a', fontWeight:700 }}>₱{(p.total_amount||0).toFixed(2)}</div>
                                  <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, background: p.status==='paid'?'rgba(28,200,138,0.2)':'rgba(246,194,62,0.2)', color: p.status==='paid'?'#1cc88a':'#f6c23e' }}>
                                    {p.status==='paid'?<CheckCircle size={10}/>:<Clock size={10}/>} {p.status||'pending'}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display:'flex', gap:7, marginTop:9 }}>
                                <button onClick={() => handleMarkPaid(p)} style={{ padding:'5px 10px', background: p.status==='paid'?'rgba(246,194,62,0.15)':'rgba(28,200,138,0.15)', border: p.status==='paid'?'1px solid rgba(246,194,62,0.3)':'1px solid rgba(28,200,138,0.3)', borderRadius:7, color: p.status==='paid'?'#f6c23e':'#1cc88a', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                                  {p.status==='paid'?'Mark Pending':'Mark Paid'}
                                </button>
                                {bluetoothSupported && (
                                  <button onClick={() => reprintPurchase(p)} disabled={printing} title="Reprint receipt on thermal printer" style={{ padding:'5px 9px', background:'rgba(78,115,223,0.15)', border:'none', borderRadius:7, color:'#4e73df', cursor: printing?'not-allowed':'pointer', display:'flex', alignItems:'center' }}>
                                    <Bluetooth size={11} />
                                  </button>
                                )}
                                <button onClick={() => handleDeletePurchase(p.id)} style={{ padding:'5px 9px', background:'rgba(231,74,59,0.15)', border:'none', borderRadius:7, color:'#e74a3b', cursor:'pointer', display:'flex', alignItems:'center' }}>
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:8, display:'flex', justifyContent:'space-between' }}>
                            <span style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>Total Spent</span>
                            <span style={{ color:'#1cc88a', fontWeight:700 }}>₱{totalSpent.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <p style={{ color:'#fff', fontWeight:700, margin:'0 0 12px', fontSize:14 }}>Edit Customer</p>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10, marginBottom:12 }}>
                        <div><label style={lbl}>Name</label><input value={editData.name} onChange={e=>setEditData(d=>({...d,name:e.target.value}))} style={iStyle} onFocus={focusIn} onBlur={focusOut} /></div>
                        <div><label style={lbl}>Phone</label><input value={editData.phone} onChange={e=>setEditData(d=>({...d,phone:e.target.value}))} style={iStyle} onFocus={focusIn} onBlur={focusOut} /></div>
                        <div><label style={lbl}>Email</label><input value={editData.email} onChange={e=>setEditData(d=>({...d,email:e.target.value}))} style={iStyle} onFocus={focusIn} onBlur={focusOut} /></div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={saveEdit} style={{ flex:1, padding:10, background:'linear-gradient(135deg,#4e73df,#224abe)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14 }}>Save</button>
                        <button onClick={() => setEditMode(false)} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:14 }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
