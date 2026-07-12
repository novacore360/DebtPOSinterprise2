import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ── Wake up backup services silently on visit ──────────────────────────────
const wakeUpUrls = [
  'https://debtposinterprise-database-backup.onrender.com/',
  'https://marniestore-messengerbot.onrender.com/',
  'https://marniestore-debtpos-postgre-aiven-backup.onrender.com/'
];

wakeUpUrls.forEach((url) => {
  fetch(url, { mode: 'no-cors' }).catch(() => {}); // ignore failures — just a wake-up ping
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
