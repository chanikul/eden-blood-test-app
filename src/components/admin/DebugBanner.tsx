'use client';

import { useState, useEffect } from 'react';

interface DebugBannerProps {
  isAdmin?: boolean;
}

/**
 * Debug Banner Component
 * 
 * Displays environment information for administrators in production mode
 * Only visible to admin users and can be toggled on/off
 */
export default function DebugBanner({ isAdmin = false }: DebugBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [environment, setEnvironment] = useState<string>('');
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  
  useEffect(() => {
    // Only show for admin users
    if (!isAdmin) return;
    
    // Get environment information
    setEnvironment(process.env.NODE_ENV || 'production');
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured');
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || window.location.origin);
  }, [isAdmin]);

  // Don't render anything for non-admin users
  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {isVisible && (
        <div className="bg-amber-100 border-t-4 border-amber-500 p-3 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="font-bold text-amber-800 mr-2">PRODUCTION MODE</span>
              <span className="text-sm text-amber-700 mr-4">Environment: {environment}</span>
              <span className="text-sm text-amber-700 mr-4">API: {apiUrl}</span>
              <span className="text-sm text-amber-700">Supabase: {supabaseUrl}</span>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-amber-800 hover:text-amber-600"
            >
              Hide
            </button>
          </div>
        </div>
      )}
      
      {!isVisible && (
        <button 
          onClick={() => setIsVisible(true)}
          className="bg-amber-500 text-white px-3 py-1 rounded-t-md shadow-md"
          style={{ position: 'absolute', bottom: '0', right: '20px' }}
        >
          Debug Info
        </button>
      )}
    </div>
  );
}
