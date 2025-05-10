import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Percent as Soccer } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

// E-posta adresini normalleştirme işlevi
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    let isValid = true;
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'E-posta adresi gereklidir';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Şifre gereklidir';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // E-posta adresini küçük harfe dönüştürelim ve boşlukları temizleyelim
      const normalizedEmail = normalizeEmail(email);
      
      console.log('Giriş denenecek e-posta:', normalizedEmail);
      console.log('Girilen şifre uzunluğu:', password.length);
      
      const { error } = await signIn(normalizedEmail, password);
      
      if (error) {
        console.error('Login error:', error);
        console.error('Login error message:', error.message);
        console.error('Login error details:', error.details);
        
        // Tüm hataları genel bir hata mesajı ile göster
        setErrors({
          general: `Giriş başarısız. E-posta adresi veya şifre hatalı. (Hata: ${error.message || 'Bilinmeyen'})`
        });
        return;
      }
      
      // Giriş başarılı - AuthContext içindeki yönlendirme kullanılacak
      console.log('Giriş başarılı, yönlendirme bekleniyor...');
    } catch (error: any) {
      console.error('Login error (catch):', error);
      setErrors({
        general: 'Giriş başarısız. Lütfen daha sonra tekrar deneyin.'
      });
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    setTestResult('Test ediliyor...');
    try {
      // 1. Supabase bağlantısını test et
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        setTestResult(`Supabase bağlantı hatası: ${error.message}`);
        return;
      }
      
      // 2. Mevcut oturumu kontrol et
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      
      // 3. Sonuçları göster
      let result = 'Test Sonuçları:\n';
      result += `- Supabase Bağlantısı: Başarılı\n`;
      result += `- Oturum Durumu: ${session ? 'Aktif' : 'Oturum açılmamış'}\n`;
      
      if (session) {
        result += `- Kullanıcı ID: ${session.user.id}\n`;
        result += `- Kullanıcı Email: ${session.user.email}\n`;
        
        // Rolü kontrol et
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (roleError) {
          result += `- Rol Kontrolü: Hata (${roleError.message})\n`;
        } else {
          result += `- Kullanıcı Rolü: ${userData.role}\n`;
        }
      }
      
      setTestResult(result);
    } catch (error: any) {
      setTestResult(`Test hatası: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Soccer className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Hesabınıza giriş yapın</h2>
          <p className="mt-2 text-sm text-gray-600">
            Veya{' '}
            <Link to="/signup" className="font-medium text-emerald-600 hover:text-emerald-500">
              hemen kaydolun
            </Link>
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Giriş</h3>
          </CardHeader>
          <CardContent>
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
                {errors.general}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="email"
                type="email"
                label="E-posta adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="ornek@mail.com"
                autoComplete="email"
              />
              
              <Input
                id="password"
                type="password"
                label="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="········"
                autoComplete="current-password"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Beni hatırla
                  </label>
                </div>
                
                <div className="text-sm">
                  <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                    Şifremi unuttum
                  </a>
                </div>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;