import axios from 'axios';

// Create axios client with common settings
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
