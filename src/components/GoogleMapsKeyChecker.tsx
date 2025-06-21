import React, { useEffect, useState } from 'react';

export function GoogleMapsKeyChecker() {
  const [apiKeyStatus, setApiKeyStatus] = useState<{
    exists: boolean;
    prefix: string | null;
    length: number | null;
  }>({
    exists: false,
    prefix: null,
    length: null,
  });

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    setApiKeyStatus({
      exists: !!apiKey,
      prefix: apiKey ? `${apiKey.substring(0, 4)}...` : null,
      length: apiKey ? apiKey.length : null,
    });
  }, []);

  return (
    <div style={{ padding: '10px', margin: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h3>Google Maps API Key Status</h3>
      <p>API Key exists: {apiKeyStatus.exists ? 'Yes' : 'No'}</p>
      {apiKeyStatus.exists && (
        <>
          <p>API Key prefix: {apiKeyStatus.prefix}</p>
          <p>API Key length: {apiKeyStatus.length} characters</p>
        </>
      )}
    </div>
  );
}
