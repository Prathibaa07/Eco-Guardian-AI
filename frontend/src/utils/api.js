import axios from 'axios';

// Create axios client with common settings
const api = axios.create({
  baseURL: 'https://eco-guardian-ai-9b3o.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
