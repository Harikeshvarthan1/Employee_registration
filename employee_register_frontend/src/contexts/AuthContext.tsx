import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../models/types';

interface AuthContextType {
  currentUser: AuthUser | null; // Changed from user to currentUser to match your Header
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null); // Changed from user to currentUser
  
  // Initialize user from localStorage on component mount
  useEffect(() => {
    console.log("AuthProvider initializing");
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log("Found stored user data:", parsedUser);
        setCurrentUser(parsedUser); // Changed from setUser to setCurrentUser
      } else {
        console.log("No stored user data found");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      localStorage.removeItem('userData');
    }
  }, []);
  
  // Login function that sets the user based on role
  const login = async (credentials: any, role: string): Promise<void> => {
    console.log(`Logging in as ${role} with username: ${credentials.userName}`);
    
    // Create user object with provided credentials and role
    const userData: AuthUser = {
      userId: Date.now(),
      userName: credentials.userName || 'User',
      email: credentials.email || `${credentials.userName}@example.com`,
      role: role.toUpperCase() as 'ADMIN' | 'USER', // Explicitly cast to match the type
      token: "auth-token-" + Math.random().toString(36).substring(2, 15)
    };
    
    // Store in localStorage and update state
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log("User data stored:", userData);
    setCurrentUser(userData); // Changed from setUser to setCurrentUser
    
    return Promise.resolve();
  };

  const logout = (): void => {
    console.log("Logging out");
    localStorage.removeItem('userData');
    setCurrentUser(null); // Changed from setUser to setCurrentUser
  };

  const isLoggedIn = (): boolean => {
    return currentUser !== null; // Changed from user to currentUser
  };

  const isAdmin = (): boolean => {
    return currentUser?.role === 'ADMIN'; // Changed from lowercase 'admin' to uppercase 'ADMIN'
  };

  const isUser = (): boolean => {
    return currentUser?.role === 'USER'; // Changed from lowercase 'user' to uppercase 'USER'
  };

  const getCurrentUserEmail = (): string => {
    return currentUser?.email || ''; // Changed from user to currentUser
  };

  const getToken = (): string | null => {
    return currentUser?.token || null; // Changed from user to currentUser
  };
  
  // Create context value
  const contextValue: AuthContextType = {
    currentUser, // Changed from user to currentUser
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

