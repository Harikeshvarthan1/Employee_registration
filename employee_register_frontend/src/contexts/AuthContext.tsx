import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../models/types';

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
  isUser: () => boolean;
  login: (credentials: any, role: string) => Promise<void>;
  logout: () => void;
  getCurrentUserEmail: () => string;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      }
    } catch (error) {
      localStorage.removeItem('userData');
    }
  }, []);

  const login = async (credentials: any, role: string): Promise<void> => {
    const userData: AuthUser = {
      userId: Date.now(),
      userName: credentials.userName || 'User',
      email: credentials.email || `${credentials.userName}@example.com`,
      role: role.toUpperCase() as 'ADMIN' | 'USER',
      token: "auth-token-" + Math.random().toString(36).substring(2, 15)
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    setCurrentUser(userData);
    return Promise.resolve();
  };

  const logout = (): void => {
    localStorage.removeItem('userData');
    setCurrentUser(null);
  };

  const isLoggedIn = (): boolean => {
    return currentUser !== null;
  };

  const isAdmin = (): boolean => {
    return currentUser?.role === 'ADMIN';
  };

  const isUser = (): boolean => {
    return currentUser?.role === 'USER';
  };

  const getCurrentUserEmail = (): string => {
    return currentUser?.email || '';
  };

  const getToken = (): string | null => {
    return currentUser?.token || null;
  };

  const contextValue: AuthContextType = {
    currentUser,
    isLoggedIn,
    isAdmin,
    isUser,
    login,
    logout,
    getCurrentUserEmail,
    getToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

