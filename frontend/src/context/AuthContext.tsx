import React, { createContext, useContext, useState, useEffect } from 'react';

// MOCK: This simulates a user object that would normally come from a backend auth provider (like Supabase, NextAuth, etc.)
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // MOCK: Auto-login as 'Alex' to support the dashboard build phase.
  // In a real app, this would start as null and verify a session token via API.
  const [user, setUser] = useState<User | null>({
    id: 'mock-user-1',
    name: 'Alex',
    email: 'alex@nexawis.com',
    role: 'admin',
    avatarUrl: 'https://ui-avatars.com/api/?name=Alex&background=random'
  });
  
  const [loading, setLoading] = useState(false);

  // MOCK: Simulate loading state checks
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser({
        id: 'mock-user-2',
        name: email.split('@')[0],
        email: email,
        role: 'user',
        avatarUrl: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
      });
      setLoading(false);
    }, 1000);
  };

  const logout = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 500);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
