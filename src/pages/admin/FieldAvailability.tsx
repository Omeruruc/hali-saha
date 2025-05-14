import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { addDays, format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar } from 'lucide-react';

const HOURS = Array.from({ length: 16 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);
const getDateString = (date: Date) => format(date, 'yyyy-MM-dd');

const FieldAvailability: React.FC = () => {
  const { id } = useParams();
  const fieldId = id || '3'; // Varsayılan olarak ID 3 kullanılır, eğer URL'den gelirse o kullanılır
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [editSlots, setEditSlots] = useState<{ [hour: string]: boolean }>({});
  const [slotPrices, setSlotPrices] = useState<{ [hour: string]: number }>({});
  const [slotDeposits, setSlotDeposits] = useState<{ [hour: string]: number }>({});
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);
  const [creatingFutureDays, setCreatingFutureDays] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [bulkDeposit, setBulkDeposit] = useState<number>(0);
  const [isAllAvailable, setIsAllAvailable] = useState<boolean>(true);
  const [fieldName, setFieldName] = useState<string>('');
  const [loadingField, setLoadingField] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin' && userRole !== null) {
      navigate('/');
      toast.error('Bu sayfaya erişim izniniz yok.');
      return;
    }
    
    // Halısaha bilgilerini yükle
    fetchFieldInfo();
    
    // Halısaha için gelecek 6 gün için otomatik kayıtları kontrol et ve oluştur
    checkAndCreateFutureDayAvailabilities();
  }, [navigate, userRole, fieldId]);

  // Halısaha bilgilerini getir
  const fetchFieldInfo = async () => {
    if (!fieldId) return;
    
    setLoadingField(true);
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('name')
        .eq('id', fieldId)
        .single();
      
      if (error) {
        console.error('Halısaha bilgileri getirilirken hata:', error);
        toast.error('Halısaha bilgileri yüklenirken bir hata oluştu.');
      } else if (data) {
        setFieldName(data.name);
      }
    } catch (error) {
      console.error('Halısaha bilgileri getirilirken beklenmeyen hata:', error);
    } finally {
      setLoadingField(false);
    }
  };

  // Gelecek 6 gün için availabilities kayıtlarını kontrol et ve oluştur
  const checkAndCreateFutureDayAvailabilities = async () => {
    if (!fieldId) return;
    
    setCreatingFutureDays(true);
    try {
      const today = new Date();
      const futureDays = Array.from({ length: 6 }, (_, i) => addDays(today, i + 1));
      const futureDatesFormatted = futureDays.map(date => getDateString(date));
      
      // Bu halısaha için tüm tarihleri getir
      const { data: existingDates } = await supabase
        .from('availabilities')
        .select('date')
        .eq('field_id', fieldId)
        .in('date', futureDatesFormatted);
      
      // Mevcut tarihleri bir set'e dönüştür
      const existingDatesSet = new Set(existingDates?.map(item => item.date) || []);
      
      // Her eksik tarih için yeni kayıt oluştur
      for (const dateStr of futureDatesFormatted) {
        if (!existingDatesSet.has(dateStr)) {
          // Bu tarih için saatlik slotları oluştur
          for (const hour of HOURS) {
            const { error } = await supabase
              .from('availabilities')
              .insert({
                field_id: fieldId,
                date: dateStr,
                start_time: hour,
                end_time: `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
                is_reserved: false,
                price: 0,
                deposit_amount: 0,
              });
            
            if (error) {
              console.error(`Tarih ${dateStr}, saat ${hour} eklenirken hata:`, error);
            }
          }
          toast.success(`${dateStr} tarihi için müsaitlikler oluşturuldu.`);
        }
      }
    } catch (error) {
      console.error('Gelecek günler için müsaitlik oluşturulurken hata:', error);
      toast.error('Gelecek tarihler için müsaitlik oluşturulurken bir hata oluştu.');
    } finally {
      setCreatingFutureDays(false);
    }
  };

  useEffect(() => {
    if (!fieldId) return;
    
    fetchAvailabilities();
  }, [fieldId, selectedDate]);

  const fetchAvailabilities = async () => {
    setLoadingAvail(true);
    try {
      const { data, error } = await supabase
        .from('availabilities')
        .select('*')
        .eq('field_id', fieldId)
        .eq('date', selectedDate);
      
      if (error) {
        console.error('Müsaitlikler getirilirken hata:', error);
        toast.error('Müsaitlikler yüklenirken bir hata oluştu.');
        setLoadingAvail(false);
        return;
      }
      
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
      
      // Mevcut saatlerden herhangi biri reserved ise All Available'ı false olarak ayarla
      const anySlotReserved = Object.values(slotMap).some(isReserved => isReserved);
      setIsAllAvailable(!anySlotReserved);
      
      // Ortalama fiyat ve kapora değerlerini ayarla
      const avgPrice = Object.values(priceMap).reduce((sum, price) => sum + price, 0) / HOURS.length;
      const avgDeposit = Object.values(depositMap).reduce((sum, deposit) => sum + deposit, 0) / HOURS.length;
      setBulkPrice(avgPrice || 0);
      setBulkDeposit(avgDeposit || 0);
    } catch (error) {
      console.error('Müsaitlikler getirilirken beklenmeyen hata:', error);
      toast.error('Müsaitlikler yüklenirken bir hata oluştu.');
    } finally {
      setLoadingAvail(false);
    }
  };

  const handleSlotToggle = (hour: string) => {
    setEditSlots(prev => ({ ...prev, [hour]: !prev[hour] }));
  };

  const applyBulkPricing = () => {
    const newPrices = { ...slotPrices };
    const newDeposits = { ...slotDeposits };
    
    HOURS.forEach(hour => {
      const slot = availabilities.find(a => a.start_time === hour);
      if (!slot?.is_reserved) {
        newPrices[hour] = bulkPrice;
        newDeposits[hour] = bulkDeposit;
      }
    });
    
    setSlotPrices(newPrices);
    setSlotDeposits(newDeposits);
    toast.success('Toplu fiyatlandırma uygulandı!');
  };

  const toggleAllAvailability = () => {
    const newIsAllAvailable = !isAllAvailable;
    setIsAllAvailable(newIsAllAvailable);
    
    const newEditSlots = { ...editSlots };
    HOURS.forEach(hour => {
      const slot = availabilities.find(a => a.start_time === hour);
      if (!slot?.is_reserved) {
        newEditSlots[hour] = !newIsAllAvailable; // !newIsAllAvailable çünkü editSlots'da true=dolu anlamına geliyor
      }
    });
    
    setEditSlots(newEditSlots);
  };

  const handleSaveSlots = async () => {
    setSavingSlots(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      console.log('Kaydetme işlemi başlıyor...', {
        fieldId,
        selectedDate,
        availabilities: availabilities.length,
        editSlots,
        slotPrices,
        slotDeposits
      });
      
      // Her saat için tek tek güncelleme yapalım, Promise.all'da sorun olabilir
      for (const hour of HOURS) {
        const slot = availabilities.find(a => a.start_time === hour);
        const price = slotPrices[hour] || 0;
        const deposit = slotDeposits[hour] || 0;
        
        if (slot) {
          // Mevcut kayıtları güncelle
          console.log(`${hour} saati güncelleniyor:`, {
            id: slot.id,
            is_reserved: editSlots[hour],
            price,
            deposit_amount: deposit
          });
          
          const { data, error } = await supabase
            .from('availabilities')
            .update({ 
              is_reserved: editSlots[hour], 
              price, 
              deposit_amount: deposit 
            })
            .eq('id', slot.id)
            .select();
          
          if (error) {
            console.error(`Saat ${hour} güncellenirken hata:`, error);
            errorCount++;
          } else {
            console.log(`${hour} saati başarıyla güncellendi:`, data);
            successCount++;
          }
        } else {
          // Yeni kayıt ekle
          console.log(`${hour} saati için yeni kayıt oluşturuluyor:`, {
            field_id: fieldId,
            date: selectedDate,
            start_time: hour,
            is_reserved: editSlots[hour],
            price,
            deposit_amount: deposit
          });
          
          const { data, error } = await supabase
            .from('availabilities')
            .insert({
              field_id: fieldId,
              date: selectedDate,
              start_time: hour,
              end_time: `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
              is_reserved: editSlots[hour],
              price,
              deposit_amount: deposit,
            })
            .select();
          
          if (error) {
            console.error(`Saat ${hour} eklenirken hata:`, error);
            errorCount++;
          } else {
            console.log(`${hour} saati için yeni kayıt oluşturuldu:`, data);
            successCount++;
          }
        }
        
        // Her işlem arasında kısa bir bekleme ekleyelim
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Sonuçları raporla
      if (errorCount === 0) {
        toast.success(`Tüm müsaitlikler başarıyla kaydedildi! (${successCount} kayıt güncellendi)`);
      } else {
        toast.error(`${successCount} kayıt güncellendi, ${errorCount} kayıtta sorun oluştu.`);
      }
      
      // Verileri yeniden yükle
      await fetchAvailabilities();
    } catch (error) {
      console.error('Müsaitlik kaydedilirken beklenmeyen hata:', error);
      toast.error('Müsaitlikler kaydedilirken bir hata oluştu.');
    } finally {
      setSavingSlots(false);
    }
  };

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="outline"
              className="mr-2"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Geri
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">
              {loadingField ? 'Yükleniyor...' : fieldName ? `${fieldName} - Müsaitlik Takvimi` : `Halısaha #${fieldId} - Müsaitlik Takvimi`}
            </h1>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
              <Calendar className="h-7 w-7 text-emerald-500" />
              Müsaitlik Takvimi
            </h2>
            <p className="text-gray-500 text-base mt-2">Her gün için saatleri dolu/boş olarak işaretleyin ve kaydedin.</p>
            
            <div className="mt-4 flex justify-between items-center">
              <Button 
                onClick={checkAndCreateFutureDayAvailabilities} 
                variant="outline" 
                loading={creatingFutureDays}
                className="text-sm"
              >
                Gelecek 6 Gün İçin Müsaitlik Oluştur
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAvail ? (
              renderLoadingState()
            ) : (
              <>
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
                
                {/* Toplu ayarlar paneli */}
                <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-700 mb-3">Toplu Ayarlar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tüm Saatler İçin Fiyat</label>
                      <input
                        type="number"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-base font-semibold text-gray-700"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tüm Saatler İçin Kapora</label>
                      <input
                        type="number"
                        value={bulkDeposit}
                        onChange={(e) => setBulkDeposit(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-base font-semibold text-gray-700"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isAllAvailable}
                        onChange={toggleAllAvailability}
                        className="accent-emerald-500 w-5 h-5 rounded border-2 border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Tüm Saatleri {isAllAvailable ? 'Müsait' : 'Dolu'} Olarak İşaretle
                      </label>
                    </div>
                    <Button
                      onClick={applyBulkPricing}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                    >
                      Toplu Fiyatlandırmayı Uygula
                    </Button>
                  </div>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FieldAvailability; 