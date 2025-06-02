"use client";

import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

export default function ToasterProvider() {
  // Use useState and useEffect to ensure this only renders on the client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <Toaster position="bottom-right" />;
}
