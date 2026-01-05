// food-ordering-platform/vendor-app/vendor-app-work-branch/context/authContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store'; 
import { useQueryClient } from '@tanstack/react-query';
import { LoginData, RegisterData, User, AuthResponse } from '../types/auth.types';
import { useCurrentUser, useLogin, useRegister } from '../services/auth/auth.queries';

// 1. Update the Interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean; // <--- ADD THIS
  isLoading: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const refreshUser = async () => {
    await refetch();
  };

  const login = async (data: LoginData): Promise<AuthResponse> => {
    try {
      const res = await loginMutation.mutateAsync(data);
      
      if (res.requireOtp) {
        return res; 
      }

      if (res.token) {
        await SecureStore.setItemAsync('auth_token', res.token);
        await refetch(); 
      }
      return res;
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const res = await registerMutation.mutateAsync(data);
      return res;
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    queryClient.setQueryData(['currentUser'], null);
    queryClient.removeQueries({ queryKey: ['currentUser'] });
  };

  // 2. Calculate isAuthenticated
  const isAuthenticated = !!user; 

  return (
    <AuthContext.Provider 
      value={{ 
        user: user || null, 
        isAuthenticated, // <--- PASS THIS VALUE
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