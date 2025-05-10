import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Card, { CardContent } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { MapPin, Calendar, Filter, Search, Star, X, Clock, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

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
  price_range: {
    min: number;
    max: number;
  };
}

const FieldsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('city') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'>('price_asc');

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
            cities(name),
            availabilities(price)
          `);

        if (selectedCity) {
          query = query.eq('city_id', selectedCity);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        const formattedFields = data.map(field => {
          const prices = field.availabilities?.map((a: any) => a.price) || [];
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

          return {
            id: field.id,
            name: field.name,
            location: field.location,
            description: field.description,
            city_id: field.city_id,
            city_name: field.cities?.name || '',
            image_url: field.image_url || 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg',
            price_range: {
              min: minPrice,
              max: maxPrice
            }
          };
        });

        // Apply filters and sorting
        let filteredFields = formattedFields.filter(field => {
          const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              field.location.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesPrice = field.price_range.min >= priceRange[0] && field.price_range.max <= priceRange[1];
          return matchesSearch && matchesPrice;
        });

        // Sort fields
        filteredFields.sort((a, b) => {
          switch (sortBy) {
            case 'price_asc':
              return a.price_range.min - b.price_range.min;
            case 'price_desc':
              return b.price_range.min - a.price_range.min;
            case 'name_asc':
              return a.name.localeCompare(b.name);
            case 'name_desc':
              return b.name.localeCompare(a.name);
            default:
              return 0;
          }
        });
        
        setFields(filteredFields);
      } catch (error) {
        console.error('Error fetching fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [selectedCity, searchTerm, priceRange, sortBy]);

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
    setSearchTerm('');
    setPriceRange([0, 1000]);
    setSortBy('price_asc');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900 to-emerald-700 overflow-hidden mb-12">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg"
            alt="Soccer field"
            className="w-full h-full object-cover mix-blend-overlay opacity-20"
          />
        </div>
        <div className="relative px-8 py-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Halısaha Bul ve Rezervasyon Yap
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Şehrinizdeki en iyi halısahaları keşfedin
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Halısaha adı veya konum ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white placeholder-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="md:w-auto w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtreler
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg mb-8 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şehir
              </label>
              <Select
                options={cities.map(city => ({ value: city.id, label: city.name }))}
                value={selectedCity}
                onChange={handleCityChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiyat Aralığı
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">
                  {priceRange[0]}₺ - {priceRange[1]}₺
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sıralama
              </label>
              <Select
                options={[
                  { value: 'price_asc', label: 'Fiyat (Artan)' },
                  { value: 'price_desc', label: 'Fiyat (Azalan)' },
                  { value: 'name_asc', label: 'İsim (A-Z)' },
                  { value: 'name_desc', label: 'İsim (Z-A)' }
                ]}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="text-gray-600"
            >
              <X className="w-4 h-4 mr-2" />
              Filtreleri Temizle
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-gray-300 rounded-t-xl"></div>
              <CardContent>
                <div className="h-5 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : fields.length > 0 ? (
          fields.map((field) => (
            <Card 
              key={field.id} 
              className="group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-white overflow-hidden rounded-xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={field.image_url}
                  alt={field.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center text-white mb-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{field.city_name}, {field.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {Array(5).fill(0).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < 4 ? 'text-amber-400' : 'text-gray-300'}`}
                          fill={i < 4 ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-white text-sm">4.0 (24)</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                  {field.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {field.description || 'Profesyonel standartlarda halısaha tesisi.'}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">45 dk</span>
                  </div>
                  <div className="flex items-center text-emerald-600 font-medium">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>{field.price_range.min}₺'den başlayan</span>
                  </div>
                </div>
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
            <p className="text-gray-600 mb-4">
              Seçtiğiniz filtrelere uygun halısaha bulunamadı. Lütfen farklı filtreler deneyin.
            </p>
            <Button
              onClick={handleClearFilters}
              variant="outline"
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