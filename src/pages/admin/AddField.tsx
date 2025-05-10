import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Percent as Soccer } from 'lucide-react';
import toast from 'react-hot-toast';

interface City {
  id: number;
  name: string;
}

const AddField: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Kullanıcı admin değilse yönlendir
    if (userRole !== 'admin' && userRole !== null) {
      navigate('/');
      toast.error('Bu sayfaya erişim izniniz yok.');
      return;
    }
    
    // Şehirleri yükle
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setCities(data || []);
      } catch (error) {
        console.error('Şehirler yüklenirken hata oluştu:', error);
        toast.error('Şehirler yüklenirken bir sorun oluştu.');
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, [navigate, userRole]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Halısaha adı gereklidir';
    }
    
    if (!cityId) {
      newErrors.cityId = 'Şehir seçimi gereklidir';
    }
    
    if (!location.trim()) {
      newErrors.location = 'Adres gereklidir';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    if (!user) {
      toast.error('Giriş yapmanız gerekiyor');
      return;
    }
    
    setLoading(true);
    try {
      // Halısahayı ekle
      const { data, error } = await supabase
        .from('fields')
        .insert({
          name,
          location,
          description: description || null,
          image_url: imageUrl || null,
          city_id: cityId,
          owner_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Halısaha başarıyla eklendi!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Halısaha eklenirken hata oluştu:', error);
      toast.error('Halısaha eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <Soccer className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">Yeni Halısaha Ekle</h1>
          <p className="text-gray-600 mt-2">Lütfen halısaha bilgilerini giriniz</p>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800">Halısaha Detayları</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="name"
                label="Halısaha Adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="Örn: Yeşil Vadi Halısaha"
                required
              />
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir
                </label>
                <select
                  id="city"
                  value={cityId || ''}
                  onChange={(e) => setCityId(Number(e.target.value) || null)}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border-gray-300 ${errors.cityId ? 'border-red-300' : ''}`}
                  disabled={loadingCities}
                  required
                >
                  <option value="">Şehir seçin</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.cityId && (
                  <p className="mt-1 text-sm text-red-600">{errors.cityId}</p>
                )}
              </div>
              
              <Input
                id="location"
                label="Adres"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                error={errors.location}
                placeholder="Örn: Atatürk Mah. Spor Cad. No:42"
                required
              />
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border-gray-300"
                  placeholder="Halısaha hakkında kısa bir açıklama..."
                />
              </div>
              
              <Input
                id="imageUrl"
                label="Görsel URL (Opsiyonel)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/dashboard')}
                  fullWidth
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  fullWidth
                >
                  {loading ? 'Ekleniyor...' : 'Halısaha Ekle'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddField;