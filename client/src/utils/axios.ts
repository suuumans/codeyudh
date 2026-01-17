
// import axios from "axios";


// export const axiosInstance = axios.create({
//     baseURL: import.meta.env.MODE === "development" ? "http://localhost:5050/api/v1" : "/api/v1",
//     withCredentials: true
// })


// axiosInstance.ts
import axios from 'axios';

// Use environment-aware API configuration
const getBaseURL = () => {
  // In development, use localhost with the dev server port
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:3000/api/v1';
  }

  // In production, use the API URL from environment variable
  // On Vercel, set VITE_API_BASE_URL to your Render backend URL
  // Example: https://codeyudh-server.onrender.com/api/v1
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    return apiBaseUrl;
  }
  
  // Fallback (shouldn't be needed on production if env var is set)
  return '/api/v1';
};

export const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to attach token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - clear token and redirect to login
      console.log('Unauthorized access - clearing token and redirecting to login');
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// export default axiosInstance;
