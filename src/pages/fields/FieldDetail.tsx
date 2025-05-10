import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import { MapPin, Calendar, Clock, DollarSign, ChevronRight, ChevronLeft, Info, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Field {
  id: number;
  name: string;
  location: string;
  description: string;
  city_id: number;
  city_name: string;
  image_url: string;
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  price: number;
  deposit_amount: number;
  is_reserved: boolean;
}

const FieldDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Generate next 7 dates for date picker
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const HOURS = Array.from({ length: 16 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);

  useEffect(() => {
    const fetchField = async () => {
      try {
        const { data, error } = await supabase
          .from('fields')
          .select(`
            id,
            name,
            location,
            description,
            image_url,
            city_id,
            cities(name)
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setField({
          id: data.id,
          name: data.name,
          location: data.location,
          description: data.description,
          city_id: data.city_id,
          city_name: Array.isArray(data.cities) ? (data.cities as any[])[0]?.name : (data.cities as any)?.name || '',
          image_url: data.image_url || 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg'
        });
      } catch (error) {
        console.error('Error fetching field details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchField();
  }, [id]);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!id) return;
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      try {
        const { data, error } = await supabase
          .from('availabilities')
          .select('*')
          .eq('field_id', id)
          .eq('date', formattedDate);
        if (error) throw error;
        // Admin panelindeki müsaitlik takviminden gelen verileri müşteri panelindeki müsaitlik takvimine aktar
        // Sayfa yenilendiğinde verilerin korunması için doğrudan setAllSlots ile güncelle
        setAllSlots(data || []);
      } catch (error) {
        console.error('Error fetching time slots:', error);
      }
    };
    fetchTimeSlots();
  }, [id, selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleReservation = async () => {
    if (!user) {
      toast.error('Rezervasyon yapabilmek için giriş yapmalısınız.');
      navigate('/login');
      return;
    }

    if (!selectedTimeSlot) {
      toast.error('Lütfen bir saat dilimi seçin.');
      return;
    }

    setReservationLoading(true);

    try {
      // Insert reservation record
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          customer_id: user.id,
          availability_id: selectedTimeSlot.id,
          deposit_paid: false,
          reservation_time: new Date().toISOString()
        })
        .select();
      
      if (reservationError) throw reservationError;
      
      // Update availability to mark as reserved
      const { error: availabilityError } = await supabase
        .from('availabilities')
        .update({ is_reserved: true })
        .eq('id', selectedTimeSlot.id);
      
      if (availabilityError) throw availabilityError;
      
      // Başarı mesajı göster
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/reservations/${reservationData[0].id}/payment`);
      }, 2000);
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Rezervasyon oluşturulurken bir hata oluştu.');
    } finally {
      setReservationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded-lg mb-6"></div>
          <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded mb-4 w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-300 rounded-lg"></div>
            <div className="h-64 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Halısaha Bulunamadı</h2>
          <p className="text-gray-600 mb-6">
            Aradığınız halısaha bulunamadı veya artık mevcut değil.
          </p>
          <Button
            onClick={() => navigate('/fields')}
            variant="primary"
          >
            Tüm Halısahalara Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-gray-900">Ana Sayfa</button>
        <ChevronRight className="h-4 w-4 mx-1" />
        <button onClick={() => navigate('/fields')} className="hover:text-gray-900">Halısahalar</button>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-gray-900">{field.name}</span>
      </div>
      
      {/* Field Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{field.name}</h1>
        <div className="flex items-center text-gray-600">
          <MapPin className="h-5 w-5 mr-1" />
          <span>{field.city_name}, {field.location}</span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Field info */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            <img
              src={field.image_url}
              alt={field.name}
              className="w-full h-96 object-cover rounded-lg shadow-md"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Halısaha Hakkında</h2>
            <p className="text-gray-700 mb-6">
              {field.description || 'Profesyonel standartlarda halısaha tesisi. Suni çim yüzeyi, ışıklandırma sistemi ve soyunma odalarıyla keyifli bir futbol deneyimi sunar.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Özellikler</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                    Suni Çim Yüzey
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                    Işıklandırma Sistemi
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                    Soyunma Odaları
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                    Duş İmkanı
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Kurallar</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                    Krampon Kullanımı Serbesttir
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                    Top Temin Edilir
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                    Yelek Temin Edilir
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                    İçecek Servisi Vardır
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Reservation */}
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Rezervasyon Yap</h2>
            </CardHeader>
            <CardContent>
              {/* Date picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih Seçin
                </label>
                <div className="flex overflow-x-auto py-2 space-x-2">
                  {dates.map((date) => (
                    <button
                      key={date.toString()}
                      onClick={() => handleDateChange(date)}
                      className={`flex flex-col items-center justify-center p-2 min-w-[80px] rounded-lg border ${
                        format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-gray-300 hover:border-emerald-500'
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {format(date, 'EEE', { locale: tr })}
                      </span>
                      <span className="text-lg font-bold">
                        {format(date, 'd', { locale: tr })}
                      </span>
                      <span className="text-xs">
                        {format(date, 'MMM', { locale: tr })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time slots */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saat Seçin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ...allSlots.filter(slot => !slot.is_reserved),
                    ...allSlots.filter(slot => slot.is_reserved)
                  ].map((slot, idx) => (
                    <button
                      key={slot.start_time + idx}
                      disabled={slot.is_reserved}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`p-3 rounded-lg border text-center transition-all duration-150
                        ${selectedTimeSlot?.start_time === slot.start_time ? 'bg-emerald-600 text-white border-emerald-600' :
                          slot.is_reserved ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
                          'border-gray-300 hover:border-emerald-500'}
                      `}
                    >
                      <div className="text-sm font-medium flex flex-col items-center gap-1">
                        <span>{slot.start_time} - {slot.end_time}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-1 ${slot.is_reserved ? 'bg-gray-200 text-gray-400' : 'bg-emerald-100 text-emerald-700'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 16v-4" /></svg>
                          {slot.price} ₺
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-1 ${slot.is_reserved ? 'bg-gray-200 text-gray-400' : 'bg-yellow-100 text-yellow-700'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                          Kapora: {slot.deposit_amount} ₺
                        </span>
                      </div>
                      {slot.is_reserved && (
                        <div className="text-xs mt-1">Dolu</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Price info */}
              {selectedTimeSlot && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Toplam Ücret:</span>
                    <span className="font-semibold text-lg">
                      {selectedTimeSlot.price} ₺
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">Kapora (Ön Ödeme):</span>
                    <span className="font-medium text-emerald-600">
                      {selectedTimeSlot.deposit_amount} ₺
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    * Kalan miktar sahada ödenir.
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleReservation}
                disabled={!selectedTimeSlot || reservationLoading}
                variant="primary"
                fullWidth
                className="mt-2"
              >
                {reservationLoading ? (
                  'İşleniyor...'
                ) : (
                  <>
                    <Calendar className="h-5 w-5 mr-2" />
                    Rezervasyon Yap
                  </>
                )}
              </Button>
              
              {!user && (
                <p className="text-sm text-gray-500 mt-3">
                  * Rezervasyon yapabilmek için giriş yapmalısınız.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-gradient-to-br from-emerald-400 to-blue-400 rounded-2xl shadow-2xl p-10 text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Tebrikler!</h2>
            <p className="text-white text-lg mb-4">Rezervasyonunuz başarıyla oluşturuldu.</p>
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center bg-white rounded-full shadow-lg">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white text-sm">Ödeme sayfasına yönlendiriliyorsunuz...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldDetail;