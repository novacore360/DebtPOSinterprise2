// src/utils/bluetoothPrinter.js
// Talks directly to a Bluetooth (BLE) thermal printer using the browser's
// native Web Bluetooth API — no RawBT / third-party printer app required.
//
// Cheap thermal printers don't agree on one GATT service, so instead of
// hard-filtering by a single UUID we (1) advertise the common candidate
// service UUIDs as "optional" so the browser exposes them after pairing,
// and (2) fall back to scanning every service/characteristic on the device
// for the first one that supports "write".

// Known write-capable service/characteristic UUID pairs used by most
// generic 58mm/80mm Bluetooth LE thermal printers on the market.
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // very common generic printer service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC / many Chinese printer modules
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // seen on some GOOJPRT-style printers
];

const CHUNK_SIZE = 100;      // bytes per BLE write (safe under most MTU limits)
const CHUNK_DELAY_MS = 25;   // small pause between writes so the printer buffer keeps up

export const isBluetoothSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.bluetooth;

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

export class BluetoothThermalPrinter {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.onDisconnected = null;
  }

  get isConnected() {
    return !!(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  get name() {
    return this.device?.name || 'Thermal Printer';
  }

  /** Prompts the browser's device picker and connects. Must be called from a user gesture (button click). */
  async connect() {
    if (!isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not available in this browser. Use Chrome on Android/desktop.');
    }

    this.device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_PRINTER_SERVICES,
    });

    this.device.addEventListener('gattserverdisconnected', () => {
      this.characteristic = null;
      this.server = null;
      if (this.onDisconnected) this.onDisconnected();
    });

    this.server = await this.device.gatt.connect();
    this.characteristic = await this._findWritableCharacteristic();

    if (!this.characteristic) {
      this.disconnect();
      throw new Error('Connected, but no writable printer service was found on this device.');
    }

    return { name: this.name };
  }

  async _findWritableCharacteristic() {
    // Try known services first (fast path).
    for (const uuid of KNOWN_PRINTER_SERVICES) {
      try {
        const service = await this.server.getPrimaryService(uuid);
        const chars = await service.getCharacteristics();
        const match = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
        if (match) return match;
      } catch {
        // service not present on this device — keep looking
      }
    }
    // Fall back: scan every service/characteristic exposed for anything writable.
    try {
      const services = await this.server.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          const match = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
          if (match) return match;
        } catch {
          // ignore unreadable service
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  async disconnect() {
    try { this.device?.gatt?.disconnect(); } catch { /* ignore */ }
    this.characteristic = null;
    this.server = null;
  }

  /** Sends raw ESC/POS bytes to the printer in safe chunks. */
  async print(bytes) {
    if (!this.isConnected) throw new Error('Printer is not connected.');
    const useNoResponse = !!this.characteristic.properties.writeWithoutResponse;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      if (useNoResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      await sleep(CHUNK_DELAY_MS);
    }
  }
}
