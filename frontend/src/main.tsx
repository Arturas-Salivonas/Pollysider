import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Removed React.StrictMode - it was causing WebSocket to disconnect immediately
// in development (double-mount behavior)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
