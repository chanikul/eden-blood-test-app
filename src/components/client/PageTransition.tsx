'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition component
 * 
 * This component provides smooth transitions between pages by:
 * 1. Preventing the flash of content during navigation
 * 2. Maintaining the previous page's content until the new page is ready
 * 3. Adding a subtle fade-in effect for the new page
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  // When the pathname changes, update the displayed children
  useEffect(() => {
    // Skip the initial render
    if (!isTransitioning) {
      setIsTransitioning(true);
      return;
    }

    // Short timeout to allow for the fade-out effect
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 10);

    return () => clearTimeout(timeout);
  }, [pathname, children]);

  return (
    <div
      className={`transition-opacity duration-200 ${
        isTransitioning ? 'opacity-95' : 'opacity-100'
      }`}
    >
      {displayChildren}
    </div>
  );
}
