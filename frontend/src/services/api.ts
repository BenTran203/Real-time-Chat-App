
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .replace(/\/$/, '');

console.log('API Base URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 seconds

});

/**
 * Interceptors run before/after every request
 * - request interceptor: Runs BEFORE sending request
 * - response interceptor: Runs AFTER receiving response
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chatwave-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
  if (import.meta.env.DEV) {
      console.log(`✅ Response from ${response.config.url}:`, response.status);
    }
    return response;
  },  // Success - pass through
  (error) => {

      console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      baseURL: error.config?.baseURL
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('chatwave-token');
      localStorage.removeItem('chatwave-user');

      // Only redirect if not already on login/register
      if (!window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


