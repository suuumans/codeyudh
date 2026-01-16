
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
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access, redirecting to login');
      // You could dispatch to your auth store here to clear the user
    }
    return Promise.reject(error);
  }
);;

// export default axiosInstance;
