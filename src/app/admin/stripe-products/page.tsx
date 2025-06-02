import dynamic from 'next/dynamic';
import { AdminLayout } from '@/components/admin/AdminLayout';

const StripeProductsTable = dynamic(() => import('@/components/admin/StripeProductsTable'), { ssr: false });

export default function StripeProductsPage() {
  return (
    <AdminLayout>
      <StripeProductsTable />
    </AdminLayout>
  );
}
