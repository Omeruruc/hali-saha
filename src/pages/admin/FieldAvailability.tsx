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
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Müsaitlik Takvimi
            </h2>
            <p className="text-gray-500 text-base mt-2">Her gün için saatleri dolu/boş olarak işaretleyin ve kaydedin.</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6 justify-center">
              {days.map(day => (
                <button
                  key={getDateString(day)}
                  className={`px-4 py-2 rounded-xl font-semibold border text-lg shadow transition-all duration-150 ${selectedDate === getDateString(day) ? 'bg-gradient-to-r from-emerald-500 to-blue-400 text-white border-emerald-500 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'}`}
                  onClick={() => setSelectedDate(getDateString(day))}
                >
                  <span className="block font-bold">{format(day, 'EEE', { locale: undefined })}</span>
                  <span className="block text-xl">{format(day, 'd')}</span>
                  <span className="block text-sm">{format(day, 'MMM')}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HOURS.map(hour => {
                const isSlotReserved = availabilities.find((a: any) => a.start_time === hour)?.is_reserved;
                return (
                  <div key={hour} className={`flex flex-col items-center p-4 rounded-2xl shadow-lg border-2 transition-all duration-150 ${isSlotReserved ? 'bg-gradient-to-r from-red-100 to-red-200 border-red-400' : editSlots[hour] ? 'bg-gradient-to-r from-red-100 to-red-200 border-red-400' : 'bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={!editSlots[hour]}
                        onChange={() => !isSlotReserved && handleSlotToggle(hour)}
                        className="accent-emerald-500 w-6 h-6 rounded-lg border-2 border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500"
                        disabled={isSlotReserved}
                      />
                      <span className={`text-lg font-bold ${isSlotReserved ? 'text-red-600' : editSlots[hour] ? 'text-red-600' : 'text-emerald-600'}`}>{hour}</span>
                    </div>
                    <span className={`mb-2 px-3 py-1 rounded-full text-sm font-semibold ${isSlotReserved ? 'bg-red-500 text-white' : editSlots[hour] ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{isSlotReserved ? 'Dolu' : (editSlots[hour] ? 'Dolu' : 'Boş')}</span>
                    <input
                      type="number"
                      placeholder="Fiyat"
                      value={slotPrices[hour] || ''}
                      onChange={(e) => setSlotPrices({ ...slotPrices, [hour]: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-base font-semibold text-gray-700 shadow-sm mb-2 transition-all duration-150"
                      disabled={isSlotReserved}
                    />
                    <input
                      type="number"
                      placeholder="Kapora"
                      value={slotDeposits[hour] || ''}
                      onChange={(e) => setSlotDeposits({ ...slotDeposits, [hour]: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-base font-semibold text-gray-700 shadow-sm transition-all duration-150"
                      disabled={isSlotReserved}
                    />
                  </div>
                );
              })}
            </div>
            <Button
              className="mt-8 text-lg py-4 rounded-xl shadow-lg"
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