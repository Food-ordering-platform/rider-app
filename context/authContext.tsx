import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoginData, RegisterData, User, AuthResponse } from '../types/auth.types';
import { useCurrentUser, useLogin, useRegister } from '../services/auth/auth.queries';
import { tokenStorage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
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
      
      // If backend requires OTP, we don't save permanent tokens yet.
      // (You might save a temp token here if your OTP flow requires it)
      if (res.requireOtp) {
        if (res.token) {
           await tokenStorage.setItem('access_token', res.token);
        }
        return res; 
      }

      // 🟢 THE FIX: Save BOTH the access and refresh tokens
      if (res.token && res.refreshToken) {
        await tokenStorage.setItem('access_token', res.token); 
        await tokenStorage.setItem('refresh_token', res.refreshToken); 
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
      // 🟢 Just in case your register endpoint returns tokens immediately
      if (res.token && res.refreshToken) {
        await tokenStorage.setItem('access_token', res.token);
        await tokenStorage.setItem('refresh_token', res.refreshToken);
        await refetch();
      }
      return res;
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    // 🟢 Nuke both tokens from storage
    await tokenStorage.removeItem('access_token'); 
    await tokenStorage.removeItem('refresh_token'); 
    
    queryClient.setQueryData(['currentUser'], null);
    queryClient.removeQueries({ queryKey: ['currentUser'] });
  };

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