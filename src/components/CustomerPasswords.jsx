import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Edit2, Check, X, KeyRound, Shuffle } from 'lucide-react';

const iStyle = { width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box' };

// Generates a random 5-digit number (10000–99999) that isn't already used.
function generateUniquePassword(usedSet) {
  let pass;
  do {
    pass = Math.floor(10000 + Math.random() * 90000);
  } while (usedSet.has(pass));
  return pass;
}

const hasPassword = (c) => c.userPass !== undefined && c.userPass !== null && String(c.userPass).trim() !== '';

export default function CustomerPasswords({ customers, updateCustomer, onBack }) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return customers
      .filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(search))
      .slice(0, 6);
  }, [search, customers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(search));
  }, [search, customers]);

  const missingCount = useMemo(() => customers.filter(c => !hasPassword(c)).length, [customers]);

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditValue(hasPassword(c) ? String(c.userPass) : '');
    setError('');
  };
  const cancelEdit = () => { setEditingId(null); setEditValue(''); setError(''); };

  const saveEdit = async (c) => {
    const trimmed = editValue.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setError('Password must be exactly 5 digits.');
      return;
    }
    const num = Number(trimmed);
    const dupOwner = customers.find(o => o.id !== c.id && hasPassword(o) && Number(o.userPass) === num);
    if (dupOwner) {
      setError(`Already used by ${dupOwner.name}. Passwords must be unique.`);
      return;
    }
    await updateCustomer(c.id, { userPass: num });
    setEditingId(null); setEditValue(''); setError('');
  };

  // Auto-assigns a unique 5-digit password to every customer who doesn't have one yet.
  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const used = new Set(customers.filter(hasPassword).map(c => Number(c.userPass)));
      const missing = customers.filter(c => !hasPassword(c));
      for (const c of missing) {
        const pass = generateUniquePassword(used);
        used.add(pass);
        await updateCustomer(c.id, { userPass: pass });
      }
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'#0f0f1a', zIndex:1000, overflowY:'auto' }}>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'16px 16px 40px' }}>
        {/* Header with back navigation */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 style={{ color:'#fff', margin:0, fontSize:18, fontWeight:700 }}>Customer Passwords</h2>
            <p style={{ color:'rgba(255,255,255,0.4)', margin:'2px 0 0', fontSize:12 }}>
              {customers.length} customers · {missingCount} without password
            </p>
          </div>
        </div>

        {/* Search with suggestions */}
        <div style={{ position:'relative', marginBottom:14 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search customers by name or phone…"
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

        {/* Auto-assign button */}
        <button
          onClick={handleAutoAssign}
          disabled={assigning || missingCount === 0}
          style={{
            width:'100%', padding:'11px', marginBottom:16,
            background: missingCount === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#4e73df,#224abe)',
            border:'none', borderRadius:9,
            color: missingCount === 0 ? 'rgba(255,255,255,0.3)' : '#fff',
            fontWeight:700, cursor: missingCount === 0 ? 'default' : 'pointer', fontSize:13,
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          }}
        >
          <Shuffle size={14} />
          {assigning
            ? 'Assigning passwords…'
            : missingCount === 0
              ? 'All customers already have a password'
              : `Set Password — assign to ${missingCount} customer${missingCount > 1 ? 's' : ''} without one`}
        </button>

        {/* Customer list */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(c => {
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{c.phone || c.email || 'No contact'}</div>
                </div>

                {!isEditing ? (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(78,115,223,0.1)', border:'1px solid rgba(78,115,223,0.25)', borderRadius:8, padding:'6px 10px' }}>
                      <KeyRound size={12} color="#4e73df" />
                      <span style={{ color:'#fff', fontWeight:700, fontSize:14, letterSpacing:1, fontFamily:'monospace' }}>
                        {hasPassword(c) ? String(c.userPass) : '—'}
                      </span>
                    </div>
                    <button onClick={() => startEdit(c)} style={{ padding:'7px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center' }}>
                      <Edit2 size={12} />
                    </button>
                  </>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        maxLength={5}
                        autoFocus
                        style={{ width:90, padding:'7px 9px', background:'rgba(255,255,255,0.06)', border:'1px solid #4e73df', borderRadius:7, color:'#fff', fontSize:14, textAlign:'center', letterSpacing:1, fontFamily:'monospace', outline:'none' }}
                      />
                      <button onClick={() => saveEdit(c)} style={{ padding:'7px 9px', background:'rgba(28,200,138,0.15)', border:'1px solid rgba(28,200,138,0.3)', borderRadius:7, color:'#1cc88a', cursor:'pointer', display:'flex', alignItems:'center' }}>
                        <Check size={13} />
                      </button>
                      <button onClick={cancelEdit} style={{ padding:'7px 9px', background:'rgba(231,74,59,0.15)', border:'1px solid rgba(231,74,59,0.3)', borderRadius:7, color:'#e74a3b', cursor:'pointer', display:'flex', alignItems:'center' }}>
                        <X size={13} />
                      </button>
                    </div>
                    {error && <span style={{ color:'#e74a3b', fontSize:11, maxWidth:220 }}>{error}</span>}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 16px', color:'rgba(255,255,255,0.2)', fontSize:14 }}>No customers found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
