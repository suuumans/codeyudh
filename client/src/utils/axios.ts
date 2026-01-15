
// import axios from "axios";


// export const axiosInstance = axios.create({
//     baseURL: import.meta.env.MODE === "development" ? "http://localhost:5050/api/v1" : "/api/v1",
//     withCredentials: true
// })


// axiosInstance.ts
import axios from 'axios';

// Use environment-aware API configuration
const getBaseURL = () => {
  // Check for custom API URL from environment variables
  const customApiUrl = import.meta.env.VITE_API_URL;
  if (customApiUrl) {
    return customApiUrl;
  }
  
  // In development, use localhost with the dev server port
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:3000/api/v1';
  }

  
  // In production, use relative URL so it works with any domain
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
);

// export default axiosInstance;
