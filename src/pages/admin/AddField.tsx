import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import { Percent as Soccer, Save, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface City {
  id: number;
  name: string;
}

interface TimeSlot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  price: number;
  deposit_amount: number;
}

const AddField: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cityId: '',
    location: '',
    description: '',
    imageUrl: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg'
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    {
      id: '1',
      day: '1', // Monday
      start_time: '18:00',
      end_time: '19:00',
      price: 400,
      deposit_amount: 100
    }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const days = [
    { value: '1', label: 'Pazartesi' },
    { value: '2', label: 'Salı' },
    { value: '3', label: 'Çarşamba' },
    { value: '4', label: 'Perşembe' },
    { value: '5', label: 'Cuma' },
    { value: '6', label: 'Cumartesi' },
    { value: '0', label: 'Pazar' }
  ];

  useEffect(() => {
    // Redirect if not admin
    if (userRole !== 'admin' && userRole !== null) {
      navigate('/');
      toast.error('Bu sayfaya erişim izniniz yok.');
    }
    
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase.from('cities').select('*');
        if (error) throw error;
        setCities(data || []);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };

    fetchCities();
  }, [navigate, userRole]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updatedTimeSlots = [...timeSlots];
    updatedTimeSlots[index] = {
      ...updatedTimeSlots[index],
      [field]: value
    };
    setTimeSlots(updatedTimeSlots);
  };

  const addTimeSlot = () => {
    const newId = (parseInt(timeSlots[timeSlots.length - 1]?.id || '0') + 1).toString();
    setTimeSlots([
      ...timeSlots,
      {
        id: newId,
        day: '1',
        start_time: '18:00',
        end_time: '19:00',
        price: 400,
        deposit_amount: 100
      }
    ]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Halısaha adı gereklidir';
    }
    
    if (!form.cityId) {
      newErrors.cityId = 'Şehir seçimi gereklidir';
    }
    
    if (!form.location.trim()) {
      newErrors.location = 'Lokasyon bilgisi gereklidir';
    }
    
    if (!form.description.trim()) {
      newErrors.description = 'Açıklama gereklidir';
    }
    
    timeSlots.forEach((slot, index) => {
      if (parseFloat(slot.end_time) <= parseFloat(slot.start_time)) {
        newErrors[`timeSlot-${index}-time`] = 'Bitiş saati, başlangıç saatinden sonra olmalıdır';
      }
      
      if (slot.price <= 0) {
        newErrors[`timeSlot-${index}-price`] = 'Geçerli bir fiyat giriniz';
      }
      
      if (slot.deposit_amount <= 0 || slot.deposit_amount >= slot.price) {
        newErrors[`timeSlot-${index}-deposit`] = 'Kapora, toplam fiyattan düşük olmalıdır';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Lütfen formdaki hataları düzeltin.');
      return;
    }
    
    if (!user) {
      toast.error('Giriş yapmalısınız.');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Insert field
      const { data: fieldData, error: fieldError } = await supabase
        .from('fields')
        .insert({
          owner_id: user.id,
          city_id: parseInt(form.cityId),
          name: form.name,
          location: form.location,
          description: form.description,
          image_url: form.imageUrl
        })
        .select()
        .single();
      
      if (fieldError) throw fieldError;
      
      // 2. Insert availabilities
      const today = new Date();
      const availabilityPromises = [];
      
      // Create availabilities for the next 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay().toString(); // 0 = Sunday, 1 = Monday, etc.
        
        // Filter time slots for this day of week
        const slotsForDay = timeSlots.filter(slot => slot.day === dayOfWeek);
        
        for (const slot of slotsForDay) {
          availabilityPromises.push(
            supabase.from('availabilities').insert({
              field_id: fieldData.id,
              date: date.toISOString().split('T')[0], // YYYY-MM-DD
              start_time: slot.start_time,
              end_time: slot.end_time,
              price: slot.price,
              deposit_amount: slot.deposit_amount,
              is_reserved: false
            })
          );
        }
      }
      
      await Promise.all(availabilityPromises);
      
      toast.success('Halısaha başarıyla eklendi!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error adding field:', error);
      toast.error('Halısaha eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Soccer className="h-8 w-8 text-emerald-600 mr-2" />
          Yeni Halısaha Ekle
        </h1>
        <p className="text-gray-600 mt-2">
          Halısahanızı ekleyerek müşterilerin rezervasyon yapmalarını sağlayın.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Field Information */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Halısaha Bilgileri</h2>
              </CardHeader>
              <CardContent>
                <Input
                  label="Halısaha Adı"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Örn: Yeşil Vadi Halısaha"
                  error={errors.name}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Şehir"
                    id="cityId"
                    name="cityId"
                    options={cities.map(city => ({ value: city.id, label: city.name }))}
                    value={form.cityId}
                    onChange={handleFormChange}
                    error={errors.cityId}
                  />
                  
                  <Input
                    label="Lokasyon (Semt/İlçe)"
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="Örn: Kadıköy"
                    error={errors.location}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Halısahanızın özellikleri, avantajları ve kuralları hakkında detaylı bilgi verin."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
                
                <Input
                  label="Resim URL (opsiyonel)"
                  id="imageUrl"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                  placeholder="Örn: https://example.com/image.jpg"
                />
              </CardContent>
            </Card>

            {/* Time Slots */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Zaman Dilimleri ve Fiyatlandırma</h2>
                  <Button 
                    onClick={addTimeSlot} 
                    variant="outline" 
                    type="button"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timeSlots.map((slot, index) => (
                    <div key={slot.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-gray-900">Zaman Dilimi #{index + 1}</h3>
                        {timeSlots.length > 1 && (
                          <button
                            onClick={() => removeTimeSlot(index)}
                            type="button"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Select
                          label="Gün"
                          id={`day-${index}`}
                          options={days}
                          value={slot.day}
                          onChange={(e) => handleTimeSlotChange(index, 'day', e.target.value)}
                        />
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Saat Aralığı
                          </label>
                          <div className="flex items-center">
                            <input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => handleTimeSlotChange(index, 'start_time', e.target.value)}
                              className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300"
                            />
                            <span className="mx-2">-</span>
                            <input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => handleTimeSlotChange(index, 'end_time', e.target.value)}
                              className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300"
                            />
                          </div>
                          {errors[`timeSlot-${index}-time`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`timeSlot-${index}-time`]}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Toplam Fiyat (₺)"
                          type="number"
                          value={slot.price}
                          onChange={(e) => handleTimeSlotChange(index, 'price', parseFloat(e.target.value))}
                          error={errors[`timeSlot-${index}-price`]}
                        />
                        
                        <Input
                          label="Kapora Miktarı (₺)"
                          type="number"
                          value={slot.deposit_amount}
                          onChange={(e) => handleTimeSlotChange(index, 'deposit_amount', parseFloat(e.target.value))}
                          error={errors[`timeSlot-${index}-deposit`]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                  <div className="flex">
                    <Info className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                      Belirlediğiniz zaman dilimlerine göre müsaitlik durumu otomatik olarak oluşturulacaktır. 
                      Seçtiğiniz her gün için önümüzdeki 30 gün için bu zaman dilimlerinde rezervasyon alınabilecektir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Özet</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Halısahanızı sisteme ekleyerek, müşterilerinizin online rezervasyon yapmalarını ve kapora ile yerlerini ayırmalarını sağlayacaksınız.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Eklenen Zaman Dilimleri</h3>
                    {timeSlots.map((slot, index) => (
                      <div key={slot.id} className="text-sm mb-2 pb-2 border-b border-gray-200 last:border-0">
                        <p>
                          <span className="font-medium">{days.find(d => d.value === slot.day)?.label}: </span>
                          {slot.start_time} - {slot.end_time}
                        </p>
                        <p className="text-gray-600">
                          Fiyat: {slot.price} ₺ (Kapora: {slot.deposit_amount} ₺)
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={loading}
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {loading ? 'Kaydediliyor...' : 'Halısahayı Kaydet'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      className="mt-3"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      <X className="h-5 w-5 mr-2" />
                      İptal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddField;