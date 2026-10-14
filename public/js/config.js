/**
 * Billzen — Configuración Global de la API
 * En desarrollo local: http://127.0.0.1:8000/api
 * En producción o Vercel: /api
 */
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8000/api'
  : '/api';
