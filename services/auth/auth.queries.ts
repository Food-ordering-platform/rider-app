// food-ordering-platform/vendor-app/vendor-app-work-branch/services/auth/auth.queries.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from './auth';
import { Alert } from 'react-native';
import { 
  AuthResponse, 
  LoginData, 
  RegisterData, 
  VerifyOtpPayload, 
  VerifyOtpResponse, 
  VerifyResetOtpPayload,
  VerifyResetOtpResponse
} from '../../types/auth.types';
import { toast } from '../../components/ui/Toast';
import { useEffect, useState } from 'react';
import { tokenStorage } from '@/utils/storage';

export const useCurrentUser = () => {
  const [hasToken, setHasToken] = useState(false);

  // Quickly check if a token exists before querying the backend
  useEffect(() => {
    tokenStorage.getItem('access_token').then(token => {
      setHasToken(!!token);
    });
  }, []);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: hasToken, //  THE FIX: Only run if we actually have a token
    retry: false, 
    staleTime: 1000 * 60 * 5, 
  });
}

export const useLogin = () => {

  return useMutation<AuthResponse, Error, LoginData>({
    mutationFn: authService.login,
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Login failed";
      toast.error("Login Failed", msg);
    },
    onSuccess: (data) => {
      toast.success("Welcome back!");
    }
  });
};

export const useRegister = () => {
  return useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: authService.register,
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Registration failed";
      toast.error("Registration Failed", msg);
    },
    onSuccess: (data) => {
      toast.success("Registration Successful");
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation<VerifyOtpResponse, Error, VerifyOtpPayload>({
    mutationFn: authService.verifyOtp,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Verification Successful");
      } 
    },
    onError: (error: any) => {
      let msg = error?.response?.data?.message || error.message || "Verification Failed";
      if (msg.includes("jwt expired")) msg = "Code expired. Please login again.";
      if (msg.includes("malformed")) msg = "Invalid code format.";
      
      console.error(msg);
    }
  });
};
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      toast.success("Email Sent, Check your inbox for the reset code.");
    },
    onError: (error: any) => {
      toast.error("Error", error?.response?.data?.message || "Could not send email.");
    }
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success("Success, Password reset successfully! Login with your new password.");
    },
    onError: (error: any) => {
      toast.error("Failed to reset password.", error);
    }
  });
};

export const useVerifyResetOtp = () => {
  return useMutation<VerifyResetOtpResponse, Error, VerifyResetOtpPayload>({
    mutationFn: authService.verifyResetOtp,
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Invalid or expired code.";
      toast.error("Error", msg);
    }
  });
};