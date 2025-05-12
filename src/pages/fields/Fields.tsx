import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Field {
  id: number;
  name: string;
  location: string;
  image_url?: string;
  cities: { name: string } | { name: string }[];
}

const Fields = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('fields')
          .select(`
            *,
            cities(name)
          `)
          .order('name');
        if (error) throw error;
        setFields(data || []);
      } catch (error) {
        console.error('Halısahalar yüklenirken hata oluştu:', error);
        setError('Halısahalar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  const handleFieldClick = (fieldId: number) => {
    navigate(`/customer/fields/${fieldId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Halısahalar</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field: Field) => (
          <div
            key={field.id}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleFieldClick(field.id)}
          >
            {field.image_url && (
              <img
                src={field.image_url}
                alt={field.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{field.name}</h2>
              <p className="text-gray-600 mb-2">{field.location}</p>
              <p className="text-gray-500">
                {Array.isArray(field.cities) ? field.cities[0]?.name : field.cities?.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Fields; 