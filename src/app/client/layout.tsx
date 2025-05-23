'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  TestTube2, 
  Calendar, 
  FileText, 
  Plane, 
  CreditCard, 
  Repeat, 
  MapPin, 
  User, 
  LogOut 
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/client', icon: Home },
  { name: 'My Blood Tests', href: '/client/blood-tests', icon: TestTube2 },
  { name: 'Bookings', href: '/client/bookings', icon: Calendar },
  { name: 'Repeat Prescriptions', href: '/client/prescriptions', icon: FileText },
  { name: 'Travel Letter Request', href: '/client/travel-letters', icon: Plane },
  { name: 'Payment Methods', href: '/client/payment', icon: CreditCard },
  { name: 'Subscriptions', href: '/client/subscriptions', icon: Repeat },
  { name: 'Addresses', href: '/client/addresses', icon: MapPin },
  { name: 'Account Details', href: '/client/account', icon: User },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200">
          <div className="h-16 flex items-center px-6">
            <Link href="/" className="text-2xl font-bold text-teal-800">
              Eden Clinic
            </Link>
          </div>
          <nav className="mt-6 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md 
                    transition-colors duration-150 ease-in-out
                    ${isActive 
                      ? 'bg-teal-50 text-teal-800' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-teal-600' : 'text-gray-400'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={() => {/* Add logout handler */}}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 
                rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Logout
            </button>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="py-6 px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
