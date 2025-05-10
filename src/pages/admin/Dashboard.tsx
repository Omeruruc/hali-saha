import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Edit, CalendarDays, Clock, MapPin, User, Frown, Percent } from 'lucide-react';

interface Field {
  id: number;
  name: string;
  location: string;
  city_id: number;
  cities: { name: string };
  description?: string;
  image_url?: string;
}

interface Availability {
  id: number;
  field_id: number;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  is_reserved: boolean;
}

interface Reservation {
  id: number;
  customer_id: string;
  availability_id: number;
  customer: { email: string };
  availability: Availability;
  field: Field;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState({
    fields: false,
    availabilities: false,
    reservations: false
  });

  // Halısaha sahibinin halısahalarını yükle
  useEffect(() => {
      if (!user) return;

    const fetchFields = async () => {
      setLoading(prevState => ({ ...prevState, fields: true }));
      try {
        const { data, error } = await supabase
          .from('fields')
          .select(`
            *,
            cities(name)
          `)
          .eq('owner_id', user.id)
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
  }, [user]);

  // Rezervasyonları yükle
  useEffect(() => {
    if (!fields.length || !user) return;
    
    const fieldIds = fields.map(field => field.id);
    
    const fetchReservations = async () => {
      setLoading(prevState => ({ ...prevState, reservations: true }));
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            users(email),
            availabilities(
              *,
              fields(*)
            )
            `)
            .in('availabilities.field_id', fieldIds)
          .order('reservation_time', { ascending: false });
          
        if (error) throw error;
        
        const formattedReservations = data?.map(item => ({
          id: item.id,
          customer_id: item.customer_id,
          availability_id: item.availability_id,
          customer: item.users,
          availability: item.availabilities,
          field: item.availabilities.fields
        })) || [];

          setReservations(formattedReservations);
      } catch (error) {
        console.error('Rezervasyonlar yüklenirken hata oluştu:', error);
      } finally {
        setLoading(prevState => ({ ...prevState, reservations: false }));
      }
    };

    fetchReservations();
  }, [fields, user]);

  // İstatistikler
  const totalFields = fields.length;
  const totalReservations = reservations.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-blue-100 py-10 px-2 md:px-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">Halısaha Yönetim Paneli</h1>
            <div className="flex gap-4 mt-2">
              <div className="bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3">
                <Percent className="w-8 h-8 text-emerald-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{totalFields}</div>
                  <div className="text-gray-500 text-sm">Toplam Halısaha</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{totalReservations}</div>
                  <div className="text-gray-500 text-sm">Toplam Rezervasyon</div>
                </div>
      </div>
            </div>
            </div>
          <div className="flex space-x-4">
            <Button
              as={Link}
              to="/admin/fields/new"
              variant="primary"
              leftIcon={<Plus className="h-5 w-5" />}
              className="text-lg px-6 py-3"
            >
              Yeni Halısaha Ekle
            </Button>
          </div>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Halısahalarım */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2"><Percent className="w-6 h-6" /> Halısahalarım</h2>
            </CardHeader>
            <CardContent>
              {loading.fields ? (
                <div className="flex justify-center items-center py-8">
                  <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                </div>
              ) : fields.length > 0 ? (
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
                        <span>{field.location}, {Array.isArray(field.cities) ? field.cities[0]?.name : field.cities?.name}</span>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button
                          variant="outline"
                          leftIcon={<Edit className="h-4 w-4" />}
                          as={Link}
                          to={`/admin/fields/${field.id}/edit`}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          leftIcon={<CalendarDays className="h-4 w-4" />}
                          as={Link}
                          to={`/admin/fields/${field.id}/availability`}
                        >
                          Müsaitlik Ekle
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <Frown className="w-12 h-12 mb-2" />
                  <p className="text-lg mb-4">Henüz halısaha eklemediniz.</p>
                  <Button
                    as={Link}
                    to="/admin/fields/new"
                    variant="primary"
                    className="text-lg px-6 py-3"
                  >
                    İlk Halısahanızı Ekleyin
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Rezervasyonlar */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2"><CalendarDays className="w-6 h-6" /> Gelen Rezervasyonlar</h2>
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
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">{reservation.field.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Onaylandı</span>
                                  </div>
                      <div className="flex items-center text-gray-500 text-sm gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{reservation.field.location}, {Array.isArray(reservation.field.cities) ? reservation.field.cities[0]?.name : reservation.field.cities?.name}</span>
                                </div>
                      <div className="flex items-center gap-2 mt-2">
                        <User className="h-4 w-4" />
                        <span>{reservation.customer.email}</span>
                        <CalendarDays className="h-4 w-4 ml-2" />
                        <span>{new Date(reservation.availability.date).toLocaleDateString('tr-TR')}</span>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>{reservation.availability.start_time.slice(0, 5)} - {reservation.availability.end_time.slice(0, 5)}</span>
                              </div>
                      <div className="mt-2">
                        <span className="font-semibold text-emerald-700 text-lg">
                          {reservation.availability.price} ₺
                        </span>
                              </div>
                </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <Frown className="w-12 h-12 mb-2" />
                  <p className="text-lg">Henüz rezervasyon bulunmuyor.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;