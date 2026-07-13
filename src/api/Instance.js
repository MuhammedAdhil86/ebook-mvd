import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.motorvehicleslaw.in/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Slightly increased for slower mobile networks
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Request Interceptor
 * Automatically injects the JWT token into every outgoing request.
 */
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles success globally and catches specific status codes (401, 403, 500).
 */
api.interceptors.response.use(
  (response) => {
    // You can transform the response here if needed
    // e.g., return response.data directly
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // 1. Handle "Unauthorized" (Token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear cookies and redirect to login
      Cookies.remove("token");
      Cookies.remove("user");
      
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?error=session_expired";
      }
    }

    // 2. Handle "Forbidden" (No Access / Permissions issue)
    if (error.response?.status === 403) {
      console.error("Access Denied: You do not have permission.");
    }

    // 3. Handle Server Panics / Crashes
    if (error.response?.status >= 500) {
      console.error("Server Panic: Internal Server Error");
    }

    // Log the error for debugging
    console.error(
      `API Error [${error.response?.status || 'Network'}]:`, 
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export default api;