// food-ordering-platform/vendor-app/vendor-app-work-branch/services/auth/auth.ts

import api from "../axios"; 
import {
  AuthResponse,
  LoginData,
  RegisterData,
  VerifyOtpPayload,
  VerifyOtpResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  VerifyResetOtpPayload,
  VerifyResetOtpResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from "../../types/auth.types";

export const authService = {
  // 1. Login
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const payload = { ...data, clientType: "mobile" as const };
      const response = await api.post("/auth/login", payload);
      
      // Backend returns: { message, token, user, requireOtp }
      const { token, user, requireOtp } = response.data;

      // Handle cases where backend might nest data (defensive coding)
      // but based on your controller, it is top-level.
      if (!token && !requireOtp) {
        throw new Error("No access token or OTP requirement received");
      }

      return {
        token,
        user,
        requireOtp, // <--- CRITICAL: Pass this through!
      };
    } catch (error: any) {
      console.log("Login error:", error.response?.data || error.message);
      throw error;
    }
  },

  // 2. Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>("/auth/register", data);
      return response.data; 
    } catch (error: any) {
      console.error("Register error:", error.response?.data || error.message);
      throw error;
    }
  },

  // 3. Verify OTP
  verifyOtp: async (data: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    try {
      const payload = { ...data, clientType: "mobile" as const };
      const response = await api.post("/auth/verify-otp", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // 4. Forgot Password
  forgotPassword: async (data: ForgotPasswordPayload): Promise<ForgotPasswordResponse> => {
    const response = await api.post("/auth/forgot-password", data);
    return response.data;
  },

  // 5. Verify Reset OTP
  verifyResetOtp: async (data: VerifyResetOtpPayload): Promise<VerifyResetOtpResponse> => {
    const response = await api.post("/auth/verify-reset-otp", data);
    return response.data;
  },

  // 6. Reset Password
  resetPassword: async (data: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },

  // 7. Get Current User
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    try {
      const response = await api.get("/auth/me"); 
      return response.data.user;
    } catch (error: any) {
      console.error("Get current user error:", error.response?.data || error.message);
      throw error;
    }
  },
};