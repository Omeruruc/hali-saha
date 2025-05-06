import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Percent as Soccer, PlusCircle, Calendar, User, Info, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Field {
  id: number;
  name: string;
  location: string;
  city_name: string;
  reservations_count: number;
}

interface Reservation {
  id: number;
  customer_email: string;
  field_name: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  deposit_paid: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (userRole !== 'admin' && userRole !== null) {
      navigate('/');
      toast.error('Bu sayfaya erişim izniniz yok.');
    }

    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch fields owned by the user
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('fields')
          .select(`
            id,
            name,
            location,
            cities(name)
          `)
          .eq('owner_id', user.id);

        if (fieldsError) throw fieldsError;

        const fieldIds = fieldsData.map(field => field.id);

        // Get reservation counts for each field
        const { data: reservationCounts, error: countError } = await supabase
          .from('reservations')
          .select(`
            availability_id,
            availabilities!inner(field_id)
          `)
          .in('availabilities.field_id', fieldIds);

        if (countError) throw countError;

        // Create a map of field_id to reservation count
        const countMap: Record<number, number> = {};
        reservationCounts.forEach(reservation => {
          const fieldId = reservation.availabilities.field_id;
          countMap[fieldId] = (countMap[fieldId] || 0) + 1;
        });

        // Format fields with reservation counts
        const formattedFields = fieldsData.map(field => ({
          id: field.id,
          name: field.name,
          location: field.location,
          city_name: field.cities?.name || '',
          reservations_count: countMap[field.id] || 0
        }));

        setFields(formattedFields);

        // Fetch recent reservations
        if (fieldIds.length > 0) {
          const { data: recentReservations, error: reservationsError } = await supabase
            .from('reservations')
            .select(`
              id,
              customer_id,
              deposit_paid,
              availabilities!inner(
                field_id,
                date,
                start_time,
                end_time,
                price,
                fields!inner(name)
              )
            `)
            .in('availabilities.field_id', fieldIds)
            .order('id', { ascending: false })
            .limit(5);

          if (reservationsError) throw reservationsError;

          // Fetch customer emails
          const customerIds = recentReservations.map(res => res.customer_id);
          const { data: customers, error: customersError } = await supabase
            .from('users')
            .select('id, email')
            .in('id', customerIds);

          if (customersError) throw customersError;

          // Map customer emails
          const customerMap: Record<string, string> = {};
          customers.forEach(customer => {
            customerMap[customer.id] = customer.email;
          });

          const formattedReservations = recentReservations.map(reservation => ({
            id: reservation.id,
            customer_email: customerMap[reservation.customer_id] || 'Unknown',
            field_name: reservation.availabilities.fields.name,
            date: reservation.availabilities.date,
            start_time: reservation.availabilities.start_time,
            end_time: reservation.availabilities.end_time,
            price: reservation.availabilities.price,
            deposit_paid: reservation.deposit_paid
          }));

          setReservations(formattedReservations);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Veri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user, userRole]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6 w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/5"></div>
          <div className="h-64 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Soccer className="h-8 w-8 text-emerald-600 mr-2" />
          Halısaha Yönetim Paneli
        </h1>
        <p className="text-gray-600 mt-2">
          Halısahalarınızı ve rezervasyonları yönetin.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
          <CardContent className="pt-5">
            <h2 className="text-lg font-semibold mb-2">Toplam Halısaha</h2>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{fields.length}</span>
              <Soccer className="h-10 w-10 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardContent className="pt-5">
            <h2 className="text-lg font-semibold mb-2">Toplam Rezervasyon</h2>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {fields.reduce((total, field) => total + field.reservations_count, 0)}
              </span>
              <Calendar className="h-10 w-10 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-dashed border-emerald-500">
          <CardContent className="p-6 flex items-center justify-center">
            <Button
              onClick={() => navigate('/admin/fields/new')}
              variant="primary"
              fullWidth
              className="h-full py-8 flex flex-col"
            >
              <PlusCircle className="h-8 w-8 mb-2" />
              <span className="text-lg">Yeni Halısaha Ekle</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fields & Reservations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fields List */}
        <div className="lg:col-span-1">
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Halısahalarım</h2>
            </CardHeader>
            <CardContent>
              {fields.length > 0 ? (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-emerald-500 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 mb-1">{field.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {field.city_name}, {field.location}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {field.reservations_count} Rezervasyon
                        </span>
                        <Link to={`/fields/${field.id}`}>
                          <Button variant="outline" size="sm">
                            Görüntüle
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-4">Henüz halısaha eklemediniz</p>
                  <Button
                    onClick={() => navigate('/admin/fields/new')}
                    variant="primary"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Halısaha Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Reservations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Son Rezervasyonlar</h2>
            </CardHeader>
            <CardContent>
              {reservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Müşteri
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Halısaha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih & Saat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ücret
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reservations.map((reservation) => {
                        const reservationDate = new Date(reservation.date);
                        const formattedDate = reservationDate.toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        });

                        return (
                          <tr key={reservation.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {reservation.customer_email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{reservation.field_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formattedDate}</div>
                              <div className="text-sm text-gray-500">
                                {reservation.start_time.substring(0, 5)} - {reservation.end_time.substring(0, 5)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.price} ₺
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {reservation.deposit_paid ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Kapora Ödendi
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Ödeme Bekleniyor
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : fields.length > 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Henüz rezervasyon bulunmamaktadır</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-700 mb-2">Rezervasyonları görebilmek için önce halısaha eklemelisiniz</p>
                  <Button
                    onClick={() => navigate('/admin/fields/new')}
                    variant="primary"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Halısaha Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;