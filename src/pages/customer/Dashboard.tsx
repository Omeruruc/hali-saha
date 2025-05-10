import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MapPin, Calendar, Clock, UserCircle, Frown, Percent } from 'lucide-react';

interface City {
  id: number;
  name: string;
}

interface Field {
  id: number;
  name: string;
  location: string;
  cities: {
    name: string;
  };
  image_url?: string;
}

interface Availability {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  fields: {
    id: number;
    name: string;
    location: string;
    city_id: number;
    cities: {
      name: string;
    };
    image_url?: string;
  };
}

interface Reservation {
  id: number;
  availabilities: Availability;
}

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState({
    cities: false,
    fields: false,
    reservations: false
  });

  // Şehirleri yükle
  useEffect(() => {
    const fetchCities = async () => {
      setLoading(prev => ({ ...prev, cities: true }));
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .order('name');
        if (error) throw error;
        setCities(data || []);
      } catch (error) {
        console.error('Şehirler yüklenirken hata oluştu:', error);
      } finally {
        setLoading(prevState => ({ ...prevState, cities: false }));
      }
    };
    fetchCities();
  }, []);

  // Seçilen şehirdeki halısahaları yükle
  useEffect(() => {
    if (!selectedCity) {
      setFields([]);
      return;
    }
    const fetchFields = async () => {
      setLoading(prevState => ({ ...prevState, fields: true }));
      try {
        const { data, error } = await supabase
          .from('fields')
          .select(`*, cities(name), availabilities(id, date, start_time, end_time, price, is_reserved), image_url`)
          .eq('city_id', selectedCity)
          .order('name');
        if (error) throw error;
        setFields(data || []);
      } catch (error) {
        console.error('Halısahalar yüklenirken hata oluştu:', error);
      } finally {
        setLoading(prevState => ({ ...prevState, fields: false }));
      }
    };
    fetchFields();
  }, [selectedCity]);

  // Kullanıcının rezervasyonlarını yükle
  useEffect(() => {
    if (!user) return;
    const fetchReservations = async () => {
      setLoading(prevState => ({ ...prevState, reservations: true }));
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`*, availabilities(id, date, start_time, end_time, price, fields(id, name, location, city_id, cities(name), image_url))`)
          .eq('customer_id', user.id)
          .order('reservation_time', { ascending: false });
        if (error) throw error;
        setReservations(data || []);
      } catch (error) {
        console.error('Rezervasyonlar yüklenirken hata oluştu:', error);
      } finally {
        setLoading(prevState => ({ ...prevState, reservations: false }));
      }
    };
    fetchReservations();
  }, [user]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCity(value ? Number(value) : null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-blue-100 py-10 px-2 md:px-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-10 gap-4">
          <div className="bg-white rounded-full shadow-lg p-2">
            <UserCircle className="h-14 w-14 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-1">Hoş geldin{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h1>
            <p className="text-gray-500 text-lg">Hemen halısaha ara, rezervasyon yap!</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2"><Percent className="w-6 h-6" /> Halısaha Ara</h2>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="block text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 12.414C12.633 11.633 11.367 11.633 10.586 12.414L6.343 16.657M8 8V6a4 4 0 118 0v2" /></svg>
                    Şehir Seçin
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-lg font-semibold text-gray-700 shadow-md transition-all duration-200 appearance-none"
                      value={selectedCity || ''}
                      onChange={handleCityChange}
                      disabled={loading.cities}
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.5rem' }}
                    >
                      <option value="" disabled>Şehir seçiniz</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </div>
                </div>
                {loading.fields ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  </div>
                ) : selectedCity ? (
                  fields.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {fields.map(field => (
                        <div key={field.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 p-5 flex flex-col gap-2 relative overflow-hidden group">
                          {field.image_url ? (
                            <img src={field.image_url} alt={field.name} className="rounded-xl h-36 w-full object-cover mb-2 group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="h-36 w-full flex items-center justify-center bg-emerald-50 rounded-xl mb-2">
                              <Percent className="w-12 h-12 text-emerald-300" />
                            </div>
                          )}
                          <h3 className="text-lg font-bold text-gray-900">{field.name}</h3>
                          <div className="flex items-center text-gray-500 text-sm gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{field.location}, {field.cities.name}</span>
                          </div>
                          <Button
                            variant="primary"
                            className="mt-3"
                            onClick={() => window.location.href = `/fields/${field.id}`}
                          >
                            Detayları Görüntüle
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-gray-400">
                      <Percent className="w-12 h-12 mb-2" />
                      <p className="text-lg">Seçilen şehirde halısaha bulunamadı.</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <Percent className="w-12 h-12 mb-2" />
                    <p className="text-lg">Lütfen bir şehir seçin.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="shadow-xl border-0">
              <CardHeader>
                <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2"><Calendar className="w-6 h-6" /> Rezervasyonlarım</h2>
              </CardHeader>
              <CardContent>
                {loading.reservations ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  </div>
                ) : reservations.length > 0 ? (
                  <div className="space-y-4">
                    {reservations.map(reservation => (
                      <div key={reservation.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex flex-col gap-2 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <Percent className="w-6 h-6 text-emerald-400" />
                          <h3 className="font-bold text-gray-900 text-lg">{reservation.availabilities.fields.name}</h3>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{reservation.availabilities.fields.location}, {reservation.availabilities.fields.cities.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Onaylandı</span>
                          <Calendar className="h-4 w-4 ml-2" />
                          <span>{new Date(reservation.availabilities.date).toLocaleDateString('tr-TR')}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{reservation.availabilities.start_time.slice(0, 5)} - {reservation.availabilities.end_time.slice(0, 5)}</span>
                        </div>
                        <div className="mt-2">
                          <span className="font-semibold text-emerald-700 text-lg">
                            {reservation.availabilities.price} ₺
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <Percent className="w-12 h-12 mb-2" />
                    <p className="text-lg">Henüz rezervasyon yapmadınız.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard; 