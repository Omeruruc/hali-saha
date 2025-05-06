import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type AuthContextType = {
  user: User | null;
  userRole: 'admin' | 'customer' | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, role: 'admin' | 'customer') => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for active session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        fetchUserRole(data.session.user.id);
      } else {
        setLoading(false);
      }
    };

    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    checkSession();

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', email)
          .single();
        
        if (userData) {
          // Redirect based on role
          if (userData.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/fields');
          }
          toast.success('Giriş başarılı!');
        }
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, role: 'admin' | 'customer') => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (!error && data.user) {
        // Create user record in the users table with the role
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          role
        });
        
        if (insertError) {
          return { error: insertError };
        }

        // Redirect based on role
        if (role === 'admin') {
          navigate('/admin/fields/new');
        } else {
          navigate('/fields');
        }
        
        toast.success('Kayıt başarılı! Hoş geldiniz.');
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
    toast.success('Çıkış yapıldı');
  };

  const value = {
    user,
    userRole,
    signIn,
    signUp,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};