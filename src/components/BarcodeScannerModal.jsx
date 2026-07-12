import React, { useState, useCallback, useEffect } from 'react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { X, Camera, ZapOff } from 'lucide-react';

export default function BarcodeScannerModal({ isOpen, onClose, onDetected, title = 'Scan Barcode' }) {
  const [active, setActive] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  // Activate scanner when modal opens
  useEffect(() => {
    if (isOpen) {
      setActive(true);
      setLastScan(null);
    } else {
      setActive(false);
    }
  }, [isOpen]);

  const handleDetected = useCallback((code) => {
    setLastScan(code);
    onDetected(code);
    onClose();
  }, [onDetected, onClose]);

  const { videoRef, scanning, error } = useBarcodeScanner({
    onDetected: handleDetected,
    active,
  });

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a2e', borderRadius: 16, padding: 24,
        width: '100%', maxWidth: 480, border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={20} color="#4e73df" />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{title}</span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
            color: '#fff', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            autoPlay
            playsInline
            muted
          />
          {/* Scan line animation */}
          {scanning && !error && (
            <>
              <div style={{
                position: 'absolute', inset: 0,
                border: '2px solid rgba(78,115,223,0.6)',
                borderRadius: 12, pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', left: '10%', right: '10%', height: 2,
                background: 'linear-gradient(90deg, transparent, #4e73df, transparent)',
                animation: 'scanLine 2s linear infinite',
                top: '50%',
              }} />
              {/* Corner markers */}
              {[['0%','0%'],['0%','auto'],['auto','0%'],['auto','auto']].map(([t,b], i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: t !== 'auto' ? 24 : 'auto',
                  bottom: b !== 'auto' ? 24 : 'auto',
                  left: i % 2 === 0 ? 24 : 'auto',
                  right: i % 2 === 1 ? 24 : 'auto',
                  width: 24, height: 24,
                  borderTop: i < 2 ? '3px solid #4e73df' : 'none',
                  borderBottom: i >= 2 ? '3px solid #4e73df' : 'none',
                  borderLeft: i % 2 === 0 ? '3px solid #4e73df' : 'none',
                  borderRight: i % 2 === 1 ? '3px solid #4e73df' : 'none',
                }} />
              ))}
            </>
          )}
          {error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              background: 'rgba(0,0,0,0.7)',
            }}>
              <ZapOff size={48} color="#e74a3b" />
              <p style={{ color: '#e74a3b', textAlign: 'center', margin: 0, padding: '0 16px' }}>{error}</p>
            </div>
          )}
          {!scanning && !error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Initializing camera…</p>
            </div>
          )}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 12, fontSize: 13, marginBottom: 0 }}>
          Point the camera at a barcode or QR code
        </p>

        {lastScan && (
          <div style={{
            marginTop: 8, padding: '8px 12px', background: 'rgba(28,200,138,0.15)',
            borderRadius: 8, border: '1px solid rgba(28,200,138,0.3)',
          }}>
            <span style={{ color: '#1cc88a', fontSize: 13 }}>Detected: <strong>{lastScan}</strong></span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-80px); opacity: 1; }
          100% { transform: translateY(80px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
