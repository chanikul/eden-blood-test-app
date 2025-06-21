'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSelectedLayoutSegment } from 'next/navigation';
import { PageTransition } from '@/components/client/PageTransition';
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
import { features, isFeatureEnabled } from '../../lib/config/features';
import { ClientAuthGuard } from '@/components/client/ClientAuthGuard';

// Core navigation items that are always shown
const coreNavigation = [
  { name: 'Home', href: '/client', icon: Home },
  { name: 'My Results', href: '/client/blood-tests', icon: TestTube2 },
  { name: 'Account Details', href: '/client/account', icon: User },
];

// Optional navigation items that can be enabled via feature flags
const optionalNavigation = [
  { name: 'Bookings', href: '/client/bookings', icon: Calendar, enabled: features.bookings },
  { name: 'Repeat Prescriptions', href: '/client/prescriptions', icon: FileText, enabled: features.prescriptions },
  { name: 'Travel Letter Request', href: '/client/travel-letters', icon: Plane, enabled: features.travelLetters },
  { name: 'Payment Methods', href: '/client/payment-methods', icon: CreditCard, enabled: features.paymentMethods },
  { name: 'Subscriptions', href: '/client/subscriptions', icon: Repeat, enabled: features.subscriptions },
  { name: 'Addresses', href: '/client/addresses', icon: MapPin, enabled: features.addresses },
];

// Combine core and enabled optional navigation items
const navigation = [
  ...coreNavigation,
  ...optionalNavigation.filter(item => item.enabled)
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const segment = useSelectedLayoutSegment();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // This effect ensures we only render client-side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      console.log('Starting logout process');
      
      // First try the new force-logout API
      const timestamp = new Date().getTime();
      const forceLogoutResponse = await fetch(`/api/auth/force-logout?_=${timestamp}`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      
      console.log('Force logout response status:', forceLogoutResponse.status);
      
      // Also call the regular logout endpoint as a backup
      const logoutResponse = await fetch(`/api/auth/logout?_=${timestamp}`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      
      console.log('Regular logout response status:', logoutResponse.status);
      
      if (!forceLogoutResponse.ok && !logoutResponse.ok) {
        throw new Error('Logout failed');
      }
      
      // Clear any local storage items that might contain session data
      if (typeof window !== 'undefined') {
        console.log('Clearing client-side storage');
        
        // Clear all localStorage items
        localStorage.clear();
        
        // Specifically target known session items
        const sessionKeys = [
          'supabase.auth.token',
          'eden-client-session',
          'sb-access-token',
          'sb-refresh-token',
          'supabase-auth-token'
        ];
        
        sessionKeys.forEach(key => localStorage.removeItem(key));
        
        // Force clear any cached data
        window.sessionStorage.clear();
        
        // Clear any application cache if available
        if ('caches' in window) {
          try {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
                console.log(`Deleted cache: ${name}`);
              });
            });
          } catch (e) {
            console.error('Error clearing caches:', e);
          }
        }
        
        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
          const cookieName = cookie.trim().split('=')[0];
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        });
      }
      
      // Add a small delay to ensure all cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Logout successful, redirecting to login page');
      
      // Redirect to login page after successful logout
      // Use replace instead of push to prevent back navigation to authenticated pages
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ClientAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen overflow-hidden">
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
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 
                rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="py-6 px-8">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
        </div>
      </div>
    </ClientAuthGuard>
  );
}
