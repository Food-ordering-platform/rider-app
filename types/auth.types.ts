
//-----------DATA OR REQUEST SENT TO THE BACKEND (REQUEST PAYLOADS)-----------//

import { Restaurant } from "./restaurant.types";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;          
  role: "DISPATCHER" | "RIDER" | "VENDOR"; 
  terms: boolean;
}

export interface LoginData {
  email: string;
  password: string;
  clientType?: "web" | "mobile";
}

export interface VerifyOtpPayload {
  token: string;
  code: string;
  clientType?: "web" | "mobile"; // <--- ADDED
}
export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  token: string;
  code: string;
}


//-----------DATA RECEIVED FROM THE BACKEND (RESPONSE TYPES)-----------//


export interface AuthResponse {
  user: User;
  token: string;
  requireOtp?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  restaurant?: Restaurant | null; 
}


export interface VerifyOtpResponse {
  message: string;
  user:AuthResponse['user']
  token: string; // Final auth token
}


export interface ForgotPasswordResponse {
  message: string;
  token: string; // Temporary reset token
}


export interface VerifyResetOtpResponse {
  message: string;
  resetToken: string; // Token authorized to reset password
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}