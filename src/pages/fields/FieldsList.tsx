import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Card, { CardContent } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { MapPin, Calendar, Filter, Search, Star, X } from 'lucide-react';

interface City {
  id: number;
  name: string;
}

interface Field {
  id: number;
  name: string;
  location: string;
  description: string;
  city_id: number;
  city_name: string;
  image_url: string;
}

const FieldsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('city') || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('fields')
          .select(`
            id,
            name,
            location,
            description,
            image_url,
            city_id,
            cities(name)
          `);

        if (selectedCity) {
          query = query.eq('city_id', selectedCity);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        const formattedFields = data.map(field => ({
          id: field.id,
          name: field.name,
          location: field.location,
          description: field.description,
          city_id: field.city_id,
          city_name: field.cities?.name || '',
          image_url: field.image_url || 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg'
        }));
        
        setFields(formattedFields);
      } catch (error) {
        console.error('Error fetching fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [selectedCity]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    
    if (city) {
      searchParams.set('city', city);
    } else {
      searchParams.delete('city');
    }
    
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    setSelectedCity('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Halısahalar</h1>
        <p className="text-lg text-gray-600">
          Şehrinizde bulunan halısahaları keşfedin ve rezervasyon yapın
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg mb-8">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtreler
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-600 hover:text-gray-900"
          >
            {showFilters ? (
              <X className="h-5 w-5" />
            ) : (
              <span className="text-sm">Göster</span>
            )}
          </button>
        </div>
        
        {showFilters && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Select
                  id="city"
                  label="Şehir"
                  options={cities.map(city => ({ value: city.id, label: city.name }))}
                  value={selectedCity}
                  onChange={handleCityChange}
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  fullWidth
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-gray-300"></div>
              <CardContent>
                <div className="h-5 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : fields.length > 0 ? (
          fields.map((field) => (
            <Card key={field.id} className="transition-transform hover:scale-105 hover:shadow-xl">
              <div className="h-48 overflow-hidden">
                <img
                  src={field.image_url}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {field.name}
                </h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{field.city_name}, {field.location}</span>
                </div>
                <div className="flex items-center mb-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < 4 ? 'text-amber-400' : 'text-gray-300'}`}
                      fill={i < 4 ? 'currentColor' : 'none'}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">4.0 (24 değerlendirme)</span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {field.description || 'Profesyonel standartlarda halısaha tesisi.'}
                </p>
                <Button
                  onClick={() => navigate(`/fields/${field.id}`)}
                  variant="primary"
                  fullWidth
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Rezervasyon Yap
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Halısaha Bulunamadı</h3>
            <p className="text-gray-600">
              Seçtiğiniz filtrelere uygun halısaha bulunamadı. Lütfen farklı filtreler deneyin.
            </p>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="mt-4"
            >
              Filtreleri Temizle
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldsList;