/**
 * BMS Global Production Configuration
 */
const CONFIG = {
  // Use relative '/api' on production (Vercel routes /api to FastAPI backend)
  API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : '/api',

  // WebSocket URL
  WS_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'ws://localhost:8000/ws'
    : (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws'
};
