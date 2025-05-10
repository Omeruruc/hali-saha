import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Percent as Soccer } from 'lucide-react';

// E-posta adresini normalleştirme işlevi
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

const SignUp: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'customer'>('customer');
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string; 
    general?: string 
  }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    let isValid = true;
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string; 
      general?: string 
    } = {};

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
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // E-posta adresini küçük harfe çevirelim 
      const normalizedEmail = normalizeEmail(email);
      
      const { error } = await signUp(normalizedEmail, password, role);
      
      if (error) {
        console.error('Signup error:', error);
        if (error.message?.includes('email') || error.message?.includes('already registered')) {
          setErrors({
            email: 'Bu e-posta adresi zaten kullanılıyor.'
          });
        } else {
          setErrors({
            general: `Kayıt olma işlemi başarısız oldu: ${error.message}`
          });
        }
        return;
      }
      
      // Redirect will be handled by the AuthContext
    } catch (error: any) {
      console.error('Sign up error:', error);
      setErrors({
        general: 'Kayıt olma işlemi başarısız oldu. Lütfen tekrar deneyin.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-emerald-700 via-blue-900 to-emerald-900">
      <img
        src="https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg"
        alt="Futbol Sahası"
        className="absolute inset-0 w-full h-full object-cover opacity-60 z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-blue-900/80 z-10" />
      <div className="relative z-20 w-full max-w-md mx-auto p-8 bg-white/90 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Soccer className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Hesap oluşturun</h2>
          <p className="mt-2 text-sm text-gray-600">
            Veya{' '}
            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              mevcut hesabınızla giriş yapın
            </Link>
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Kayıt Ol</h3>
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
                autoComplete="new-password"
              />
              
              <Input
                id="confirmPassword"
                type="password"
                label="Şifreyi Onaylayın"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="········"
                autoComplete="new-password"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Tipi
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      id="customer"
                      name="role"
                      type="radio"
                      checked={role === 'customer'}
                      onChange={() => setRole('customer')}
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="customer" className="ml-2 block text-sm text-gray-900">
                      Müşteri
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="admin"
                      name="role"
                      type="radio"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="admin" className="ml-2 block text-sm text-gray-900">
                      Halısaha Sahibi
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  <span>
                    <a href="#" className="text-emerald-600 hover:text-emerald-500">
                      Kullanım şartlarını
                    </a>{' '}
                    ve{' '}
                    <a href="#" className="text-emerald-600 hover:text-emerald-500">
                      gizlilik politikasını
                    </a>{' '}
                    kabul ediyorum
                  </span>
                </label>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;