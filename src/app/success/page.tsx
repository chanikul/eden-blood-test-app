'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('Missing session_id.');
      setLoading(false);
      return;
    }

    fetch(`/api/finalize-order?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (res) => {
        if (res.redirected) {
          // If the API responds with a redirect, Next.js will not follow it automatically
          window.location.href = res.url;
          return;
        }
        const data = await res.json();
        if (data.redirectTo) {
          router.replace(data.redirectTo);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to finalize order.');
        setLoading(false);
      });
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold mb-2">Finalizing your order...</h2>
        <p className="text-gray-500">Please wait while we complete your order and set up your account.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return null;
}
