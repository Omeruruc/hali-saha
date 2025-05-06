import React from 'react';
import { Link } from 'react-router-dom';
import { Percent as Soccer, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center">
              <Soccer className="h-8 w-8 text-emerald-500" />
              <span className="ml-2 text-xl font-bold text-white">Halısaha Kirala</span>
            </div>
            <p className="mt-4 text-gray-300 text-sm">
              Türkiye'nin en büyük halısaha kiralama platformu. Şehrinizde uygun halısaha bulmak ve rezervasyon yapmak artık çok kolay!
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Linkler</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link to="/fields" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  Halısahalar
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Popüler Şehirler</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/fields?city=1" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  İstanbul
                </Link>
              </li>
              <li>
                <Link to="/fields?city=2" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  Ankara
                </Link>
              </li>
              <li>
                <Link to="/fields?city=3" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  İzmir
                </Link>
              </li>
              <li>
                <Link to="/fields?city=4" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  Antalya
                </Link>
              </li>
              <li>
                <Link to="/fields?city=5" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  Bursa
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">İletişim</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-emerald-500" />
                <span className="text-gray-300">+90 555 123 4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-emerald-500" />
                <span className="text-gray-300">info@halisahakirala.com</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-emerald-500 mt-1" />
                <span className="text-gray-300">Levent, İstanbul</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            &copy; {new Date().getFullYear()} Halısaha Kirala. Tüm hakları saklıdır.
          </p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-4">
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  Gizlilik Politikası
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-500 transition-colors">
                  Kullanım Koşulları
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;