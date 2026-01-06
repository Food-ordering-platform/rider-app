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

// Helper to log errors cleanly
const logError = (context: string, error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`[${context}] Server Error:`, {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`[${context}] Network Error (No Response):`, error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error(`[${context}] Request Setup Error:`, error.message);
  }
};

export const authService = {
  // 1. Login
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const payload = { ...data, clientType: "mobile" as const };
      const response = await api.post("/auth/login", payload);
      
      const { token, user, requireOtp } = response.data;

      if (!token && !requireOtp) {
        throw new Error("No access token or OTP requirement received");
      }

      return { token, user, requireOtp };
    } catch (error: any) {
      logError("Login", error);
      throw error;
    }
  },

  // 2. Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      // Ensure we are hitting the correct endpoint
      const response = await api.post<AuthResponse>("/auth/register", data);
      return response.data; 
    } catch (error: any) {
      logError("Register", error);
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
      logError("VerifyOTP", error);
      throw error;
    }
  },

  // 4. Forgot Password
  forgotPassword: async (data: ForgotPasswordPayload): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post("/auth/forgot-password", data);
      return response.data;
    } catch (error: any) {
      logError("ForgotPassword", error);
      throw error;
    }
  },

  // 5. Verify Reset OTP
  verifyResetOtp: async (data: VerifyResetOtpPayload): Promise<VerifyResetOtpResponse> => {
    try {
      const response = await api.post("/auth/verify-reset-otp", data);
      return response.data;
    } catch (error: any) {
      logError("VerifyResetOtp", error);
      throw error;
    }
  },

  // 6. Reset Password
  resetPassword: async (data: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
    try {
      const response = await api.post("/auth/reset-password", data);
      return response.data;
    } catch (error: any) {
      logError("ResetPassword", error);
      throw error;
    }
  },

  // 7. Get Current User
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    try {
      const response = await api.get("/auth/me"); 
      return response.data.user;
    } catch (error: any) {
      logError("GetMe", error);
      throw error;
    }
  },
};