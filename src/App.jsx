import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrinterProvider } from './context/PrinterContext';
import { useProducts, useCustomers, usePurchases } from './hooks/useFirestore';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import NewPurchase from './components/NewPurchase';
import Customers from './components/Customers';
import Settings from './components/Settings';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings as SettingsIcon } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { id: 'products',  label: 'Products',  short: 'Items', icon: Package },
  { id: 'purchase',  label: 'New Purchase', short: 'Sale', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', short: 'Clients', icon: Users },
  { id: 'settings',  label: 'Settings',  short: 'More', icon: SettingsIcon },
];

function POSApp() {
  const { user, logout, loading } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { purchases, addPurchase, updatePurchase, deletePurchase, deletePurchasesByCustomer } = usePurchases();

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--page-bg-alt)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'var(--wa-5)', fontSize:15 }}>Loading…</div>
    </div>
  );

  if (!user) return <LoginPage />;

  const now = new Date();

  return (
    <div style={{ minHeight:'100vh', background:'var(--page-bg)', fontFamily:"'DM Sans', sans-serif", paddingBottom: isMobile ? 70 : 0 }}>
      {/* Top nav — only shown on desktop */}
      {!isMobile && (
        <nav style={{
          background:'var(--nav-bg-t)', backdropFilter:'blur(12px)',
          borderBottom:'1px solid var(--wa-07)',
          padding:'0 16px', height:56,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0, zIndex:200,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:'linear-gradient(135deg,#4e73df,#1cc88a)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <ShoppingCart size={16} color="#fff" />
            </div>
            <span style={{ color:'var(--text-primary)', fontWeight:800, fontSize:15, whiteSpace:'nowrap' }}>Marnie Store</span>
            <span style={{ background:'rgba(28,200,138,0.15)', color:'#1cc88a', padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600 }}>● LIVE</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ color:'var(--wa-4)', fontSize:12 }}>
              {now.toLocaleDateString('en-PH',{ weekday:'short', month:'short', day:'numeric' })}
            </span>
            <span style={{ color:'var(--wa-5)', fontSize:11, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</span>
            <button onClick={logout} style={{
              background:'rgba(231,74,59,0.15)', border:'none', borderRadius:7,
              color:'#e74a3b', cursor:'pointer', padding:'5px 10px', fontSize:12, fontWeight:600,
            }}>Logout</button>
          </div>
        </nav>
      )}

      {/* Mobile top header */}
      {isMobile && (
        <header style={{
          background:'var(--nav-bg-t)', backdropFilter:'blur(12px)',
          borderBottom:'1px solid var(--wa-07)',
          padding:'0 16px', height:52,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0, zIndex:200,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,#4e73df,#1cc88a)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ShoppingCart size={14} color="#fff" />
            </div>
            <span style={{ color:'var(--text-primary)', fontWeight:800, fontSize:14 }}>Marnie Store</span>
          </div>
          <span style={{ color:'var(--wa-4)', fontSize:11, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</span>
        </header>
      )}

      {/* Desktop tab bar */}
      {!isMobile && (
        <div style={{
          background:'var(--nav-bg-t)', borderBottom:'1px solid var(--wa-06)',
          padding:'0 16px', display:'flex', gap:2, overflowX:'auto',
          position:'sticky', top:56, zIndex:150,
        }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                padding:'12px 16px', background:'none', border:'none',
                borderBottom: active ? '2px solid #4e73df' : '2px solid transparent',
                color: active ? '#4e73df' : 'var(--wa-45)',
                cursor:'pointer', fontWeight: active ? 700 : 500, fontSize:13,
                display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
                transition:'color 0.15s', fontFamily:'inherit',
              }}>
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Page content */}
      <div style={{ padding: isMobile ? '14px 12px' : '20px 16px', maxWidth:1400, margin:'0 auto' }}>
        {tab === 'dashboard' && <Dashboard products={products} customers={customers} purchases={purchases} />}
        {tab === 'products'  && <Products products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />}
        {tab === 'purchase'  && <NewPurchase products={products} customers={customers} addPurchase={addPurchase} addCustomer={addCustomer} updateProduct={updateProduct} />}
        {tab === 'customers' && <Customers customers={customers} purchases={purchases} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} updatePurchase={updatePurchase} deletePurchase={deletePurchase} deletePurchasesByCustomer={deletePurchasesByCustomer} />}
        {tab === 'settings'  && <Settings products={products} customers={customers} purchases={purchases} user={user} logout={logout} updateProduct={updateProduct} />}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:300,
          background:'var(--nav-bg-t)', backdropFilter:'blur(16px)',
          borderTop:'1px solid var(--wa-08)',
          display:'flex', alignItems:'stretch', height:64,
          paddingBottom:'env(safe-area-inset-bottom)',
        }}>
          {TABS.map(({ id, short, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                flex:1, background:'none', border:'none', cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
                color: active ? '#4e73df' : 'var(--wa-35)',
                padding:'6px 2px', fontFamily:'inherit',
              }}>
                <Icon size={active ? 22 : 20} />
                <span style={{ fontSize:9, fontWeight: active ? 700 : 500 }}>{short}</span>
                {active && <div style={{ width:4, height:4, borderRadius:'50%', background:'#4e73df', position:'absolute', bottom:6 }} />}
              </button>
            );
          })}
        </nav>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; background:var(--page-bg); -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:var(--wa-02); }
        ::-webkit-scrollbar-thumb { background:var(--wa-1); border-radius:2px; }
        input,select,textarea { font-family:inherit; }
        button { font-family:inherit; }
      `}</style>
    </div>
  );
}

export default function App() {
  return <AuthProvider><PrinterProvider><POSApp /></PrinterProvider></AuthProvider>;
}
