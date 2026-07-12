import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Mail, Lock, Loader } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      {[
        { w: 400, h: 400, top: '-100px', left: '-100px', color: 'rgba(78,115,223,0.08)' },
        { w: 300, h: 300, bottom: '50px', right: '100px', color: 'rgba(28,200,138,0.06)' },
        { w: 200, h: 200, top: '40%', left: '60%', color: 'rgba(246,194,62,0.06)' },
      ].map((orb, i) => (
        <div key={i} style={{
          position: 'absolute', width: orb.w, height: orb.h, borderRadius: '50%',
          background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
          top: orb.top, left: orb.left, bottom: orb.bottom, right: orb.right,
          animation: `float ${15 + i * 5}s infinite ease-in-out alternate`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{
        width: '100%', maxWidth: 420, padding: 24, position: 'relative', zIndex: 2,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: '40px 32px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 80px rgba(78,115,223,0.1)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #4e73df, #1cc88a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(78,115,223,0.4)',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShoppingBag size={28} color="#4e73df" />
              </div>
            </div>
            <h1 style={{
              margin: 0, fontSize: 28, fontWeight: 800,
              background: 'linear-gradient(135deg, #fff, #a5b4fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', letterSpacing: 0.5,
            }}>Marnie Store</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
              Point of Sale System
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4e73df' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  style={{
                    width: '100%', padding: '14px 14px 14px 44px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 15,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#4e73df'; e.target.style.boxShadow = '0 0 0 3px rgba(78,115,223,0.2)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4e73df' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  style={{
                    width: '100%', padding: '14px 14px 14px 44px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 15,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#4e73df'; e.target.style.boxShadow = '0 0 0 3px rgba(78,115,223,0.2)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(231,74,59,0.12)', border: '1px solid rgba(231,74,59,0.3)',
                color: '#e74a3b', fontSize: 13, textAlign: 'center',
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px',
                background: loading ? 'rgba(78,115,223,0.5)' : 'linear-gradient(135deg, #4e73df, #1cc88a)',
                border: 'none', borderRadius: 12, color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(78,115,223,0.35)',
              }}
              onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 12px 28px rgba(78,115,223,0.45)'; }}}
              onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = loading ? 'none' : '0 8px 24px rgba(78,115,223,0.35)'; }}
            >
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 16, fontSize: 12, letterSpacing: 1 }}>
          POS System v2.1 • Secured by Firebase
        </p>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes float { 0% { transform: translate(0,0); } 100% { transform: translate(20px,-20px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 30px rgba(78,115,223,0.4); } 50% { box-shadow: 0 0 50px rgba(78,115,223,0.7); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px rgba(26,26,46,0.9) inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>
    </div>
  );
}
