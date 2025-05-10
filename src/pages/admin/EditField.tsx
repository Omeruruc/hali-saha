import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Calendar, Clock, MapPin, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { addDays, format, isSameDay } from 'date-fns';

interface City {
  id: number;
  name: string;
}

interface Availability {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_reserved: boolean;
}

const HOURS = Array.from({ length: 16 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);

const getDateString = (date: Date) => format(date, 'yyyy-MM-dd');

const EditField: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [editSlots, setEditSlots] = useState<{ [hour: string]: boolean }>({});
  const [savingSlots, setSavingSlots] = useState(false);

  useEffect(() => {
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
        toast.error('Şehirler yüklenirken bir sorun oluştu.');
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [navigate, userRole]);

  useEffect(() => {
    // Halısaha bilgilerini getir
    const fetchField = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        setName(data.name);
        setLocation(data.location);
        setDescription(data.description || '');
        setImageUrl(data.image_url || '');
        setCityId(data.city_id);
      }
      setLoading(false);
    };
    if (id) fetchField();
  }, [id]);

  useEffect(() => {
    // Müsaitlikleri getir
    const fetchAvailabilities = async () => {
      setLoadingAvail(true);
      const { data } = await supabase
        .from('availabilities')
        .select('*')
        .eq('field_id', id)
        .eq('date', selectedDate);
      // Saatlere göre dolu/boş haritası oluştur
      const slotMap: { [hour: string]: boolean } = {};
      HOURS.forEach(hour => {
        const slot = data?.find((a: any) => a.start_time === hour);
        slotMap[hour] = slot ? slot.is_reserved : false;
      });
      setEditSlots(slotMap);
      setAvailabilities(data || []);
      setLoadingAvail(false);
    };
    if (id) fetchAvailabilities();
  }, [id, selectedDate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('fields')
        .update({
          name,
          location,
          description,
          image_url: imageUrl,
          city_id: cityId
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Halısaha güncellendi!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Güncelleme sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (availId: number, is_reserved: boolean) => {
    setLoadingAvail(true);
    await supabase
      .from('availabilities')
      .update({ is_reserved: !is_reserved })
      .eq('id', availId);
    // Yeniden yükle
    const { data } = await supabase
      .from('availabilities')
      .select('*')
      .eq('field_id', id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    setAvailabilities(data || []);
    setLoadingAvail(false);
  };

  // Slotu toggle et
  const handleSlotToggle = (hour: string) => {
    setEditSlots(prev => ({ ...prev, [hour]: !prev[hour] }));
  };

  // Slotları kaydet
  const handleSaveSlots = async () => {
    setSavingSlots(true);
    // Her saat için availability kaydı güncelle/ekle
    for (const hour of HOURS) {
      const slot = availabilities.find(a => a.start_time === hour);
      if (slot) {
        // Varsa güncelle
        await supabase
          .from('availabilities')
          .update({ is_reserved: editSlots[hour] })
          .eq('id', slot.id);
      } else {
        // Yoksa ekle
        await supabase
          .from('availabilities')
          .insert({
            field_id: id,
            date: selectedDate,
            start_time: hour,
            end_time: `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
            is_reserved: editSlots[hour],
          });
      }
    }
    toast.success('Müsaitlikler kaydedildi!');
    setSavingSlots(false);
  };

  // Tarih seçimi için ileri/geri butonları
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <Percent className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">Halısaha Düzenle</h1>
        </div>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800">Halısaha Bilgileri</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <Input
                id="name"
                label="Halısaha Adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
              />
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                <select
                  id="city"
                  value={cityId || ''}
                  onChange={(e) => setCityId(Number(e.target.value) || null)}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border-gray-300"
                  disabled={loadingCities}
                  required
                >
                  <option value="">Şehir seçin</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
              <Input
                id="location"
                label="Adres"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                error={errors.location}
                required
              />
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm border-gray-300"
                />
              </div>
              <Input
                id="imageUrl"
                label="Görsel URL (Opsiyonel)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')} fullWidth>İptal</Button>
                <Button type="submit" variant="primary" loading={loading} fullWidth>Güncelle</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditField; 