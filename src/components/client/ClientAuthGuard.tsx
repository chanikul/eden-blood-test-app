'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ClientAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientAuthGuard - A simplified component that handles client authentication
 * In development mode, it always allows access
 * In production, it relies on the middleware to handle authentication
 */
// Use a global variable to track if the initial auth check has been completed
// This prevents the loading screen from showing on subsequent navigations
let initialAuthCheckComplete = false;

export function ClientAuthGuard({ children }: ClientAuthGuardProps) {
  const [isLoading, setIsLoading] = useState(!initialAuthCheckComplete);
  const pathname = usePathname();
  
  useEffect(() => {
    // If we've already done the initial auth check, don't show loading
    if (initialAuthCheckComplete) {
      setIsLoading(false);
      return;
    }
    
    // Just a brief loading state for better UX on initial load only
    const timer = setTimeout(() => {
      setIsLoading(false);
      initialAuthCheckComplete = true;
    }, 300); // Reduced from 500ms to 300ms for faster initial load
    
    return () => clearTimeout(timer);
  }, []);
  
  // Only show loading state on initial auth check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // The middleware handles the actual authentication and redirects
  // This component just renders the children after the initial auth check
  return <>{children}</>;
}
