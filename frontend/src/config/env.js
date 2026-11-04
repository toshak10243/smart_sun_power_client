// Environment-aware API & Assets Base URL configuration
const isDevelopment = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const BASE_SERVER_URL = isDevelopment 
  ? "http://localhost:5000" 
  : "https://smartsunpower.tech";

export const API_BASE_URL = `${BASE_SERVER_URL}/api`;
export const UPLOAD_BASE_URL = `${BASE_SERVER_URL}/uploads`;

export default {
  BASE_SERVER_URL,
  API_BASE_URL,
  UPLOAD_BASE_URL
};
