import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'loan_officer' | 'employee';
  phoneNumber: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'loan_officer' | 'employee';
  phoneNumber: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Mock user data for demo
      setUser({
        _id: '1',
        username: 'demo_user',
        email: 'demo@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'loan_officer',
        phoneNumber: '+1234567890'
      });
    }
    setLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      // Mock API call - replace with actual API
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockUser: User = {
        _id: '1',
        username: 'demo_user',
        email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'loan_officer',
        phoneNumber: '+1234567890'
      };
      
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      setUser(mockUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockUser: User = {
        _id: '1',
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phoneNumber: userData.phoneNumber
      };
      
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      setUser(mockUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};