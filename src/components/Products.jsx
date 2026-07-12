import React, { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Barcode, Search, Package, X } from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';

const iStyle = { width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' };
const focusIn  = e => { e.target.style.borderColor='#4e73df'; e.target.style.boxShadow='0 0 0 2px rgba(78,115,223,0.2)'; };
const focusOut = e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; };
const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:18 };
const lbl  = { color:'rgba(255,255,255,0.55)', fontSize:12, marginBottom:5, display:'block', fontWeight:600 };

const empty = { productCode:'', name:'', costPrice:'', retailPrice:'', stock:'999999', lowStockThreshold:'5', category:'' };

export default function Products({ products, addProduct, updateProduct, deleteProduct }) {
  const [form, setForm]     = useState(empty);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.productCode?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleScan = useCallback(code => setForm(f => ({ ...f, productCode:code })), []);

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    const costPrice   = parseFloat(form.costPrice) || 0;
    const retailPrice = parseFloat(form.retailPrice);
    if (!form.name||isNaN(retailPrice)) return setError('Fill all required fields.');
    if (retailPrice < costPrice) return setError('Retail price should be ≥ cost price.');
    const dup = products.find(p => p.productCode === form.productCode && p.id !== editing);
    if (dup) return setError('Product code already exists.');
    setSaving(true);
    try {
      const data = {
        productCode: form.productCode.trim(),
        name: form.name.trim(),
        costPrice, retailPrice,
        price: retailPrice,
        stock: editing ? (parseInt(form.stock)||0) : (parseInt(form.stock)||999999),
        lowStockThreshold: parseInt(form.lowStockThreshold)||5,
        category: form.category.trim(),
      };
      if (editing) { await updateProduct(editing, data); setEditing(null); }
      else         { await addProduct(data); }
      setForm(empty); setShowForm(false);
    } catch { setError('Failed to save product.'); }
    finally { setSaving(false); }
  };

  const startEdit = p => {
    setEditing(p.id);
    setForm({ productCode:p.productCode||'', name:p.name||'', costPrice:p.costPrice?.toString()||'', retailPrice:(p.retailPrice||p.price||0).toString(), stock:(p.stock||0).toString(), lowStockThreshold:(p.lowStockThreshold||5).toString(), category:p.category||'' });
    setError(''); setShowForm(true);
  };

  const cancelEdit = () => { setEditing(null); setForm(empty); setError(''); setShowForm(false); };

  const handleDelete = async p => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    await deleteProduct(p.id);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleScan} title="Scan Product Code" />

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ color:'#fff', margin:0, fontSize:18, fontWeight:700 }}>Products</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', margin:'2px 0 0', fontSize:12 }}>{products.length} items in inventory</p>
        </div>
        <button onClick={() => { cancelEdit(); setShowForm(v=>!v); }} style={{ padding:'9px 16px', background:'linear-gradient(135deg,#4e73df,#224abe)', border:'none', borderRadius:9, color:'#fff', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontSize:13 }}>
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <p style={{ color:'#fff', fontWeight:700, margin:0, fontSize:14 }}>{editing ? 'Edit Product' : 'New Product'}</p>
            <button onClick={cancelEdit} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer' }}><X size={16} /></button>
          </div>
          {error && <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:12, background:'rgba(231,74,59,0.12)', border:'1px solid rgba(231,74,59,0.3)', color:'#e74a3b', fontSize:13 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:10 }}>
              {/* Product Code */}
              <div>
                <label style={lbl}>Code</label>
                <div style={{ position:'relative' }}>
                  <input value={form.productCode} onChange={e => setForm(f=>({...f, productCode:e.target.value}))} placeholder="e.g. PRD-001" style={{ ...iStyle, paddingRight:42 }} onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" onClick={() => setScannerOpen(true)} style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', background:'rgba(78,115,223,0.2)', border:'none', borderRadius:6, color:'#4e73df', cursor:'pointer', padding:'4px 6px', display:'flex', alignItems:'center' }}>
                    <Barcode size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Name *</label>
                <input value={form.name} onChange={e => setForm(f=>({...f, name:e.target.value}))} placeholder="Product name" style={iStyle} onFocus={focusIn} onBlur={focusOut} required />
              </div>
              <div>
                <label style={lbl}>Cost Price (Pila imong palit ani)</label>
                <input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm(f=>({...f, costPrice:e.target.value}))} placeholder="0.00" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div>
                <label style={lbl}>Retail Price (Pila imong baligya ani) *</label>
                <input type="number" min="0" step="0.01" value={form.retailPrice} onChange={e => setForm(f=>({...f, retailPrice:e.target.value}))} placeholder="0.00" style={iStyle} onFocus={focusIn} onBlur={focusOut} required />
              </div>
              <div>
                <label style={lbl}>Stock (ayaw alisdi)</label>
                <input type="number" min="0" value={form.stock} onChange={e => setForm(f=>({...f, stock:e.target.value}))} placeholder="0" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div>
                <label style={lbl}>Low-stock Alert</label>
                <input type="number" min="0" value={form.lowStockThreshold} onChange={e => setForm(f=>({...f, lowStockThreshold:e.target.value}))} placeholder="5" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <input value={form.category} onChange={e => setForm(f=>({...f, category:e.target.value}))} placeholder="e.g. Beverages" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
            <div style={{ display:'flex', gap:9, marginTop:14 }}>
              <button type="submit" disabled={saving} style={{ flex:1, padding:'11px', background: saving?'rgba(78,115,223,0.4)':'linear-gradient(135deg,#4e73df,#224abe)', border:'none', borderRadius:9, color:'#fff', fontWeight:700, cursor: saving?'not-allowed':'pointer', fontSize:14 }}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Product'}
              </button>
              {editing && (
                <button type="button" onClick={cancelEdit} style={{ padding:'11px 18px', background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, color:'#fff', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ position:'relative' }}>
        <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, or category…" style={{ ...iStyle, paddingLeft:36 }} onFocus={focusIn} onBlur={focusOut} />
      </div>

      {/* Products list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,0.2)' }}>
          <Package size={40} style={{ marginBottom:10, opacity:.3 }} />
          <p style={{ margin:0 }}>No products found</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
          {filtered.map(p => {
            const isLow = (p.stock||0) <= (p.lowStockThreshold||5);
            const isOut = (p.stock||0) === 0;
            return (
              <div key={p.id} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${isOut?'rgba(231,74,59,0.3)':isLow?'rgba(246,194,62,0.2)':'rgba(255,255,255,0.07)'}`, borderRadius:12, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, marginTop:2 }}>{p.productCode} {p.category && `· ${p.category}`}</div>
                  </div>
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    <button onClick={() => startEdit(p)} style={{ background:'rgba(78,115,223,0.15)', border:'none', borderRadius:7, color:'#4e73df', cursor:'pointer', padding:'5px 7px', display:'flex', alignItems:'center' }}><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(p)} style={{ background:'rgba(231,74,59,0.15)', border:'none', borderRadius:7, color:'#e74a3b', cursor:'pointer', padding:'5px 7px', display:'flex', alignItems:'center' }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
                  <div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, textTransform:'uppercase' }}>Retail</div>
                    <div style={{ color:'#1cc88a', fontWeight:700, fontSize:15 }}>₱{(p.retailPrice||p.price||0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, textTransform:'uppercase' }}>Cost</div>
                    <div style={{ color:'rgba(255,255,255,0.6)', fontWeight:600, fontSize:13 }}>₱{(p.costPrice||0).toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, textTransform:'uppercase' }}>Stock</div>
                    <span style={{ padding:'3px 9px', borderRadius:20, fontSize:12, fontWeight:700, background: isOut?'rgba(231,74,59,0.2)':isLow?'rgba(246,194,62,0.2)':'rgba(28,200,138,0.15)', color: isOut?'#e74a3b':isLow?'#f6c23e':'#1cc88a' }}>
                      {p.stock||0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
