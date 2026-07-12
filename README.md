# Marnie Store POS v2.1

A mobile-friendly Point of Sale system built with React + Vite + Firebase Firestore.

## Features
- 📱 Mobile-first UI with bottom navigation on mobile, tab bar on desktop
- 🛒 New Purchase with barcode scanner — scans barcode, auto-fills product from Firestore
- 📦 Product management (add/edit/delete, low-stock alerts)
- 👥 Customer management with purchase history
- 📊 Dashboard with revenue, profit, and stock alerts
- 🖨 Receipt printing
- ⚙️ Data export/import (JSON)

## Firestore Data Structure

### purchases collection
| Field              | Type   | Example                                          |
|--------------------|--------|--------------------------------------------------|
| created_by         | string | "4aFHfLLtxLMDYraHcrX7DVmy6jz2"                  |
| created_by_email   | string | "marnie@gmail.com"                               |
| customer_id        | string | "LqpdXPRlQlHtYP1jZcfY"                          |
| customer_name      | string | "Rama"                                           |
| product_data       | string | JSON string: [{"product_id":"...","name":"...","price":10,"quantity":2,"subtotal":20}] |
| purchase_date      | string | "2026-02-09T05:40:29.646Z"                       |
| status             | string | "pending" or "paid"                              |
| total_amount       | number | 20                                               |

### products collection
Fields: productCode, name, costPrice, retailPrice, price, stock, lowStockThreshold, category, createdAt

### customers collection
Fields: name, phone, email, createdAt

## Setup

1. Clone the repo
2. `cp .env.example .env` and fill in your Firebase credentials
3. `npm install`
4. `npm run dev`

## Install as App (PWA)
- On mobile Chrome: tap the **Add to Home Screen** banner or use browser menu
- On iOS Safari: tap Share → Add to Home Screen
- On desktop Chrome: click the install icon in the address bar
