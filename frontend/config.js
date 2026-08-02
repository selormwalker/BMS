/**
 * BMS Global Production Configuration
 * 
 * Replace API_BASE_URL and WS_BASE_URL with your deployed live server URLs when deploying.
 */
const CONFIG = {
  // Production or Local API URL
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8000/api'
    : 'https://bms-backend-api.onrender.com/api',

  // Production or Local WebSocket URL
  WS_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'ws://localhost:8000/ws'
    : 'wss://bms-backend-api.onrender.com/ws'
};
