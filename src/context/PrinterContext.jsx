// src/context/PrinterContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { BluetoothThermalPrinter, isBluetoothSupported } from '../utils/bluetoothPrinter';

const STORE_INFO_KEY = 'marnie_pos_store_info';

const DEFAULT_STORE_INFO = {
  name: 'Marnie Store',
  address: '',
  phone: '',
  footer: 'Thank you for your purchase!',
  paperWidth: 32, // 32 = 58mm paper, 48 = 80mm paper
};

function loadStoreInfo() {
  try {
    const raw = localStorage.getItem(STORE_INFO_KEY);
    return raw ? { ...DEFAULT_STORE_INFO, ...JSON.parse(raw) } : DEFAULT_STORE_INFO;
  } catch {
    return DEFAULT_STORE_INFO;
  }
}

const PrinterContext = createContext(null);

export function PrinterProvider({ children }) {
  const printerRef = useRef(null);
  if (!printerRef.current) printerRef.current = new BluetoothThermalPrinter();

  const [status, setStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [printerName, setPrinterName] = useState('');
  const [error, setError] = useState('');
  const [storeInfo, setStoreInfoState] = useState(loadStoreInfo);

  useEffect(() => {
    printerRef.current.onDisconnected = () => {
      setStatus('disconnected');
      setPrinterName('');
    };
  }, []);

  const connect = useCallback(async () => {
    setError('');
    setStatus('connecting');
    try {
      const { name } = await printerRef.current.connect();
      setPrinterName(name);
      setStatus('connected');
      return true;
    } catch (err) {
      setStatus('disconnected');
      setError(err.message || 'Failed to connect to printer.');
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await printerRef.current.disconnect();
    setStatus('disconnected');
    setPrinterName('');
  }, []);

  /** Ensures a printer is connected (prompting the picker if needed), then sends bytes. */
  const print = useCallback(async (bytes) => {
    if (!printerRef.current.isConnected) {
      const ok = await connect();
      if (!ok) return false;
    }
    try {
      await printerRef.current.print(bytes);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to print.');
      setStatus(printerRef.current.isConnected ? 'connected' : 'disconnected');
      return false;
    }
  }, [connect]);

  const updateStoreInfo = useCallback((patch) => {
    setStoreInfoState(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORE_INFO_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const value = {
    isSupported: isBluetoothSupported(),
    status,
    printerName,
    error,
    connect,
    disconnect,
    print,
    storeInfo,
    updateStoreInfo,
  };

  return <PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>;
}

export function usePrinter() {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error('usePrinter must be used within a PrinterProvider');
  return ctx;
}
