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

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    retry: false, // Do not retry if 401/Unauthorized
    staleTime: 1000 * 60 * 5, // Cache user data for 5 mins
  });
};

export const useLogin = () => {

  return useMutation<AuthResponse, Error, LoginData>({
    mutationFn: authService.login,
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Login failed";
      Alert.alert("Login Failed", msg);
    },
  });
};

export const useRegister = () => {
  return useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: authService.register,
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Registration failed";
      Alert.alert("Registration Failed", msg);
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation<VerifyOtpResponse, Error, VerifyOtpPayload>({
    mutationFn: authService.verifyOtp,
    onSuccess: (data) => {
      // We just pass the data back to the Screen (VerifyOtpScreen).
      // The Screen will handle saving the token or navigating.
      if (!data.token) {
        // Defensive alert, though controller ensures it.
        Alert.alert("Notice", "Verified. Please login to continue.");
      }
    },
    onError: (error: any) => {
      let msg = error?.response?.data?.message || error.message || "Verification Failed";
      if (msg.includes("jwt expired")) msg = "Your code has expired. Please login again.";
      if (msg.includes("malformed")) msg = "Invalid code format.";
      
      Alert.alert("Verification Failed", msg);
    }
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      Alert.alert("Email Sent", "Check your inbox for the reset code.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.response?.data?.message || "Could not send email.");
    }
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      Alert.alert("Success", "Password reset successfully! Login with your new password.");
    },
    onError: (error: any) => {
      Alert.alert("Error", "Failed to reset password.");
    }
  });
};

export const useVerifyResetOtp = () => {
  return useMutation<VerifyResetOtpResponse, Error, VerifyResetOtpPayload>({
    mutationFn: authService.verifyResetOtp,
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Invalid or expired code.";
      Alert.alert("Error", msg);
    }
  });
};