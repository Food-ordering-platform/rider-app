import { tokenStorage } from "../utils/storage"; // Adjust path if needed
import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  console.error("❌ Missing API URL! Check your .env file");
}

const api = axios.create({
  baseURL: BASE_URL,
  // headers:{
  //   "Content-Type":"application/json"
  // },
  timeout: 60000, // 60 seconds (Good for slow image uploads)
});

// 🟢 Request Interceptor: Attach the Access Token
api.interceptors.request.use(
  async (config) => {
    // console.log(`🚀 Requesting: ${config.baseURL}${config.url}`);
    
    // Switch to access_token
    const token = await tokenStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🟢 Response Interceptor: The Silent Refresher
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Catch 401 Unauthorized and ensure we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getItem("refresh_token");
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // 🚀 CRITICAL: Use global axios here, NOT our 'api' instance
        // Pass the refreshToken in the body exactly as your backend expects it
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken
        });

        const newAccessToken = res.data.accessToken;

        // Save the brand new Access Token
        await tokenStorage.setItem("access_token", newAccessToken);

        // Update the failed request's header and fire it again
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error("❌ Session completely expired. Logging out rider.");
        // Nuke both tokens so the app forces them back to the login screen
        await tokenStorage.removeItem("access_token");
        await tokenStorage.removeItem("refresh_token");
        
        return Promise.reject({ message: "Session expired. Please log in again.", status: 401 });
      }
    }

    // Standard Error Handling Fallback
    if (error.response) {
      console.error("❌ API Error:", error.response.status, error.response.data);
      const message = error.response.data.message || error.response.data.error || "Something went wrong";
      return Promise.reject({ message, status: error.response.status });
    } else if (error.request) {
      console.error("❌ Network Error:", error.message);
      return Promise.reject({ message: "Network Error. Check internet or server status." });
    } else {
      console.error("❌ Unknown Error:", error.message);
      return Promise.reject({ message: "An unexpected error occurred." });
    }
  }
);

export default api;