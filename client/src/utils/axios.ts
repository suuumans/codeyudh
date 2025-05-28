
// import axios from "axios";


// export const axiosInstance = axios.create({
//     baseURL: import.meta.env.MODE === "development" ? "http://localhost:5050/api/v1" : "/api/v1",
//     withCredentials: true
// })


// axiosInstance.ts
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:5050/api/v1',
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
