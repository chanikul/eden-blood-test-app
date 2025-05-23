import { OrderForm } from '@/components/order/OrderForm';

export default function OrderPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Order Blood Test</h1>
      <OrderForm />
    </div>
  );
}
