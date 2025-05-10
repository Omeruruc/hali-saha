import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Ortam değişkenlerini al
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ortam değişkenlerinin varlığını kontrol et
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase yapılandırma hatası: Eksik ortam değişkenleri');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Supabase istemcisini oluştur
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});