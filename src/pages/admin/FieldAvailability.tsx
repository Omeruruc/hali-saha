import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { addDays, format } from 'date-fns';
import toast from 'react-hot-toast';

const HOURS = Array.from({ length: 16 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);
const getDateString = (date: Date) => format(date, 'yyyy-MM-dd');

const FieldAvailability: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [editSlots, setEditSlots] = useState<{ [hour: string]: boolean }>({});
  const [slotPrices, setSlotPrices] = useState<{ [hour: string]: number }>({});
  const [slotDeposits, setSlotDeposits] = useState<{ [hour: string]: number }>({});
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin' && userRole !== null) {
      navigate('/');
      toast.error('Bu sayfaya erişim izniniz yok.');
      return;
    }
  }, [navigate, userRole]);

  useEffect(() => {
    if (!id) return;
    const fetchAvailabilities = async () => {
      setLoadingAvail(true);
      const { data } = await supabase
        .from('availabilities')
        .select('*')
        .eq('field_id', id)
        .eq('date', selectedDate);
      // Saatlere göre dolu/boş haritası oluştur
      const slotMap: { [hour: string]: boolean } = {};
      const priceMap: { [hour: string]: number } = {};
      const depositMap: { [hour: string]: number } = {};
      HOURS.forEach(hour => {
        const slot = data?.find((a: any) => a.start_time === hour);
        slotMap[hour] = slot ? slot.is_reserved : false;
        priceMap[hour] = slot ? slot.price : 0;
        depositMap[hour] = slot ? slot.deposit_amount : 0;
      });
      setEditSlots(slotMap);
      setSlotPrices(priceMap);
      setSlotDeposits(depositMap);
      setAvailabilities(data || []);
      setLoadingAvail(false);
    };
    fetchAvailabilities();
  }, [id, selectedDate]);

  const handleSlotToggle = (hour: string) => {
    setEditSlots(prev => ({ ...prev, [hour]: !prev[hour] }));
  };

  const handleSaveSlots = async () => {
    setSavingSlots(true);
    for (const hour of HOURS) {
      const slot = availabilities.find(a => a.start_time === hour);
      const price = slotPrices[hour] || 0;
      const deposit = slotDeposits[hour] || 0;
      if (slot) {
        await supabase
          .from('availabilities')
          .update({ is_reserved: editSlots[hour], price, deposit_amount: deposit })
          .eq('id', slot.id);
      } else {
        await supabase
          .from('availabilities')
          .insert({
            field_id: id,
            date: selectedDate,
            start_time: hour,
            end_time: `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
            is_reserved: editSlots[hour],
            price,
            deposit_amount: deposit,
          });
      }
    }
    toast.success('Müsaitlikler kaydedildi!');
    setSavingSlots(false);
  };

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Müsaitlik Takvimi</h1>
          <p className="text-gray-500">Her gün için saatleri dolu/boş olarak işaretleyin ve kaydedin.</p>
        </div>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800">Tarih Seç</h2>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {days.map(day => (
                <button
                  key={getDateString(day)}
                  className={`px-3 py-2 rounded-lg font-semibold border ${selectedDate === getDateString(day) ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700'} transition`}
                  onClick={() => setSelectedDate(getDateString(day))}
                >
                  {format(day, 'EEE dd MMM')}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {HOURS.map(hour => (
                <label key={hour} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 shadow-sm">
                  <input
                    type="checkbox"
                    checked={!editSlots[hour]}
                    onChange={() => handleSlotToggle(hour)}
                    className="accent-emerald-500"
                  />
                  <span className={editSlots[hour] ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                    {hour} - {editSlots[hour] ? 'Dolu' : 'Boş'}
                  </span>
                  <input
                    type="number"
                    placeholder="Fiyat"
                    value={slotPrices[hour] || ''}
                    onChange={(e) => setSlotPrices({ ...slotPrices, [hour]: Number(e.target.value) })}
                    className="w-20 px-2 py-1 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Kapora"
                    value={slotDeposits[hour] || ''}
                    onChange={(e) => setSlotDeposits({ ...slotDeposits, [hour]: Number(e.target.value) })}
                    className="w-20 px-2 py-1 border rounded"
                  />
                </label>
              ))}
            </div>
            <Button
              className="mt-6"
              variant="primary"
              loading={savingSlots}
              onClick={handleSaveSlots}
              fullWidth
            >
              Kaydet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FieldAvailability; 