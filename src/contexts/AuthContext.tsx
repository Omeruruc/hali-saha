import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// E-posta adresini normalleştirme yardımcı fonksiyonu
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

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
      // E-posta adresini küçük harfe çevirelim
      const normalizedEmail = normalizeEmail(email);
      console.log('AuthContext - Giriş denenecek e-posta:', normalizedEmail);

      // Auth ile giriş yapmayı deneyelim
      console.log('Supabase auth ile giriş deneniyor...');
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: normalizedEmail, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      console.log('Supabase auth giriş başarılı:', data);
      
      if (!data.user) {
        console.error('Kullanıcı oturum açtı ancak kullanıcı verisi bulunamadı');
        return { error: { message: 'Kullanıcı verisi bulunamadı' } };
      }
      
      console.log('Kullanıcı ID:', data.user.id);
      console.log('Kullanıcı email:', data.user.email);
      
      // Kullanıcının rolünü kontrol etmek için doğrudan ID ile sorgulama yapalım
      const { data: userDataById, error: userErrorById } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
      if (userErrorById) {
        console.error('Kullanıcı rolü ID ile bulunamadı, e-posta ile deneniyor:', userErrorById);
        
        // ID ile bulamazsak e-posta ile deneyelim
        const { data: userRoleData, error: userRoleError } = await supabase
          .from('users')
          .select('role')
          .ilike('email', normalizedEmail)
          .single();
          
        if (userRoleError) {
          console.error('Error fetching user role by email:', userRoleError);
          return { error: { message: 'Kullanıcı rolü bulunamadı.' } };
        }
        
        console.log('E-posta ile kullanıcı rolü bulundu:', userRoleData.role);
        
        // Kullanıcı verilerini güncelle
        setUser(data.user);
        setUserRole(userRoleData.role);
        
        // Kullanıcı rolüne göre yönlendirme
        toast.success('Giriş başarılı!');
        console.log('Yönlendiriliyor:', userRoleData.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
        navigate(userRoleData.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
      } else {
        console.log('ID ile kullanıcı rolü bulundu:', userDataById.role);
        
        // Kullanıcı verilerini güncelle
        setUser(data.user);
        setUserRole(userDataById.role);
        
        // Kullanıcı rolüne göre yönlendirme
        toast.success('Giriş başarılı!');
        console.log('Yönlendiriliyor:', userDataById.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
        navigate(userDataById.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign in catch error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, role: 'admin' | 'customer') => {
    try {
      // E-posta adresini normalleştir
      const normalizedEmail = normalizeEmail(email);
      console.log('SignUp - Normalleştirilmiş e-posta:', normalizedEmail);
      
      // E-posta doğrulamasını devre dışı bırakmak ve metaveri eklemek için
      const { data, error } = await supabase.auth.signUp({ 
        email: normalizedEmail, 
        password,
        options: {
          data: {
            role: role
          }
        }
      });
      
      console.log('Supabase SignUp yanıtı:', data);
      
      if (error) {
        console.error('SignUp hata:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('Kullanıcı oluşturulamadı');
        return { error: { message: 'Kullanıcı oluşturulamadı' } };
      }
      
      console.log('Oluşturulan kullanıcı:', data.user);
      
      // Create user record in the users table with the role
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: normalizedEmail,
        role
      });
      
      if (insertError) {
        console.error('Error creating user profile:', insertError);
        // Try to delete the auth user if we failed to create the profile
        await supabase.auth.admin.deleteUser(data.user.id);
        return { error: insertError };
      }

      console.log('Kullanıcı profili oluşturuldu, rol:', role);
      
      // Kullanıcı verileri önbelleğe alalım
      setUser(data.user);
      setUserRole(role);
      
      toast.success('Kayıt başarılı! Hoş geldiniz.');
      
      // Redirect based on role
      console.log('Kullanıcı yönlendiriliyor:', role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
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