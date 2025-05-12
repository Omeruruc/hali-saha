import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Percent as Soccer } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-to-r from-blue-900 to-emerald-700 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Soccer field"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="lg:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Halısaha Kiralama Artık Çok Kolay
            </h1>
            <p className="text-xl text-white mb-8">
              Türkiye'nin her şehrinde uygun halısaha bul, online rezervasyon yap, kapora ile yerini ayırt.
            </p>
            
            {!user ? (
              <div className="space-x-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  size="lg"
                >
                  Giriş Yap
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  variant="outline"
                  size="lg"
                  className="bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                >
                  Kayıt Ol
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => navigate(userRole === 'admin' ? '/admin/dashboard' : '/customer/dashboard')}
                variant="primary"
                size="lg"
              >
                {userRole === 'admin' ? 'Yönetim Paneli' : 'Halısaha Ara'}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nasıl Çalışır?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sadece 3 adımda halısaha rezervasyonu yapın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4">
                <Soccer className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Üye Olun</h3>
              <p className="text-gray-600">
                Halısaha sahibi veya müşteri olarak üyeliğinizi oluşturun
              </p>
            </div>

            <div className="text-center">
              <div 
                className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4 cursor-pointer"
                onClick={() => navigate('/customer/dashboard')}
              >
                <Soccer className="h-8 w-8" />
              </div>
              <h3 
                className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer"
                onClick={() => navigate('/customer/dashboard')}
              >
                2. Halısaha Seçin
              </h3>
              <p className="text-gray-600">
                Size uygun olan halısahayı seçin ve müsaitlik durumunu kontrol edin
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4">
                <Soccer className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Rezervasyon Yapın</h3>
              <p className="text-gray-600">
                Online kapora ödeyerek rezervasyonunuzu tamamlayın
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button
              onClick={() => navigate('/customer/dashboard')}
              variant="primary"
              size="lg"
              className="px-8"
            >
              Halısaha Ara
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hakkımızda</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Türkiye'nin en büyük halısaha rezervasyon platformu
            </p>
          </div>

          <div className="prose prose-lg mx-auto text-gray-600">
            <p>
              Halısaha Kirala, halısaha sahipleri ile müşterileri bir araya getiren modern bir platformdur.
              Amacımız, halısaha rezervasyon sürecini hem işletmeciler hem de müşteriler için kolaylaştırmaktır.
            </p>
            <p>
              Platform üzerinden halısaha sahipleri tesislerini kolayca yönetebilir, müşteriler ise
              istedikleri halısahayı bulup online olarak rezervasyon yapabilirler.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">İletişim</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sorularınız için bize ulaşın
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">İletişim Bilgileri</h3>
                  <div className="mt-4 space-y-4">
                    <p className="flex items-center text-gray-600">
                      <Soccer className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>info@halisahakirala.com</span>
                    </p>
                    <p className="flex items-center text-gray-600">
                      <Soccer className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>+90 555 123 4567</span>
                    </p>
                    <p className="flex items-center text-gray-600">
                      <Soccer className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>Levent, İstanbul</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;