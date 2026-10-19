import React, { createContext, useContext, useState, useEffect } from 'react';

// MOCK: This simulates a user object that would normally come from a backend auth provider (like Supabase, NextAuth, etc.)
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  title?: string;
  department?: string;
  avatarUrl?: string;
  avatarInitials?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initial profile synced with settings module defaults
  const [user, setUser] = useState<User | null>({
    id: 'mock-user-1',
    name: 'Alex Rivera',
    email: 'alex@nexawis.com',
    role: 'Enterprise Administrator',
    title: 'Principal Workforce Architect',
    department: 'Data & AI',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    avatarInitials: 'AR'
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

  // Listen to profile updates emitted by settingsService
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setUser(prev => prev ? { ...prev, ...customEvent.detail } : null);
      }
    };

    window.addEventListener('nexawis:profile_updated', handleProfileUpdated);
    return () => window.removeEventListener('nexawis:profile_updated', handleProfileUpdated);
  }, []);

  const updateUser = (updated: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updated } : null);
  };

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
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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
