'use client';

import dynamic from 'next/dynamic';
// Import the default export from the admin layout file instead of a named export
import AdminLayout from '../layout';

// @ts-ignore - Working around module resolution issues
const StripeProductsTable = dynamic(() => import('@/components/admin/StripeProductsTable'), { ssr: false });

export default function StripeProductsPage() {
  return (
    <AdminLayout>
      <StripeProductsTable />
    </AdminLayout>
  );
}
