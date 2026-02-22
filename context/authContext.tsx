// food-ordering-platform/rider-app/rider-app-work-branch/context/authContext.tsx

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoginData, RegisterData, User, AuthResponse } from '../types/auth.types';
import { useCurrentUser, useLogin, useRegister } from '../services/auth/auth.queries';
import { tokenStorage } from '../utils/storage'; // 🟢 Import your new storage helper

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean; // 🟢 Added
  isLoading: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // "useCurrentUser" likely fetches /auth/me. 
  // Ensure your axios interceptor is using tokenStorage too (see below).
  const { data: user, isLoading: isUserLoading, refetch } = useCurrentUser();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const refreshUser = async () => {
    await refetch();
  };

  const login = async (data: LoginData): Promise<AuthResponse> => {
    try {
      const res = await loginMutation.mutateAsync(data);
      
      // If backend requires OTP, we don't save token yet
      if (res.requireOtp) {
        return res; 
      }

      // If we got a token, save it using the WEB-SAFE storage
      if (res.token) {
        await tokenStorage.setItem('auth_token', res.token); // 🟢 Uses tokenStorage
        await refetch(); // Fetch user profile immediately
      }
      return res;
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const res = await registerMutation.mutateAsync(data);
      // If registration returns a token immediately:
      if (res.token) {
        await tokenStorage.setItem('auth_token', res.token);
        await refetch();
      }
      return res;
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    await tokenStorage.removeItem('auth_token'); // 🟢 Uses tokenStorage
    queryClient.setQueryData(['currentUser'], null);
    queryClient.removeQueries({ queryKey: ['currentUser'] });
  };

  // 🟢 Derived State
  const isAuthenticated = !!user; 

  return (
    <AuthContext.Provider 
      value={{ 
        user: user || null, 
        isAuthenticated, 
        isLoading: isUserLoading, 
        login, 
        register, 
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};