import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

export function useBarcodeScanner({ onDetected, active }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  const stop = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setScanning(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!active || !videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setScanning(true);
    setError(null);

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          onDetected(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          // NotFoundException is thrown continuously while scanning — ignore it
          setError(err.message);
        }
      })
      .catch((e) => {
        setError(e.message || 'Camera access denied');
        setScanning(false);
      });

    return () => {
      reader.reset();
    };
  }, [active, onDetected]);

  return { videoRef, scanning, error, stop };
}
