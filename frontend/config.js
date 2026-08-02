/**
 * BMS Global Production Configuration - Connected to Vercel Deployment
 */
const CONFIG = {
  // Live Vercel Production API URL
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8000/api'
    : 'https://bms-sigma-blush.vercel.app/api',

  // Live Vercel WebSocket / Polling URL
  WS_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'ws://localhost:8000/ws'
    : 'wss://bms-sigma-blush.vercel.app/ws'
};
