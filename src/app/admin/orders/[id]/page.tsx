'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileText, Calendar, User, Mail, Phone, MapPin, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { OrderStatus } from '@/types';

interface OrderDetailsProps {
  params: {
    id: string;
  };
}

export default function OrderDetailsPage({ params }: OrderDetailsProps) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false,
  });

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/orders/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`);
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrderDetails();
  }, [params.id]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    try {
      setUpdateStatus({ loading: true, error: null, success: false });
      
      const response = await fetch(`/api/admin/orders/${params.id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setUpdateStatus({ loading: false, error: null, success: true });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, success: false }));
      }, 3000);
    } catch (err) {
      console.error('Error updating order status:', err);
      setUpdateStatus({ 
        loading: false, 
        error: 'Failed to update order status. Please try again.', 
        success: false 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="secondary" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        
        <Card className="bg-white shadow-sm border border-red-200">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Order not found'}
            </h2>
            <p className="text-gray-500 mb-4">
              We couldn't find the order you're looking for. It may have been deleted or you may not have permission to view it.
            </p>
            <Button onClick={() => router.push('/admin/orders')}>
              Return to Orders List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse shipping address if it's a string
  let shippingAddress = order.shippingAddress;
  if (typeof shippingAddress === 'string') {
    try {
      shippingAddress = JSON.parse(shippingAddress);
    } catch (e) {
      console.error('Error parsing shipping address:', e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button 
        variant="secondary" 
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order Details
          </h1>
          <p className="text-sm text-gray-500">
            Order ID: {order.id}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Badge 
            className={`text-sm px-3 py-1 ${
              order.status === OrderStatus.PAID ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              order.status === OrderStatus.DISPATCHED ? 'bg-green-100 text-green-800 border-green-200' :
              order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-gray-100 text-gray-800 border-gray-200'
            }`}
          >
            {order.status}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              Order placed on {format(new Date(order.createdAt), 'PPP')} at {format(new Date(order.createdAt), 'p')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Test Type</h3>
                  <p className="text-gray-700">{order.testName}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Payment</h3>
                  <p className="text-gray-700">
                    {order.paymentIntentId ? (
                      <>
                        <span className="font-medium">£{(order.amount / 100).toFixed(2)}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          (Stripe Payment ID: {order.paymentIntentId.substring(0, 10)}...)
                        </span>
                      </>
                    ) : (
                      'Payment information not available'
                    )}
                  </p>
                </div>
              </div>
              
              {order.notes && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Order Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Name</h3>
                  <p className="text-gray-700">{order.patientName}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Date of Birth</h3>
                  <p className="text-gray-700">{order.patientDateOfBirth}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p className="text-gray-700">{order.patientEmail}</p>
                </div>
              </div>
              
              {order.patientPhone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Phone</h3>
                    <p className="text-gray-700">{order.patientPhone}</p>
                  </div>
                </div>
              )}
              
              {shippingAddress && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Shipping Address</h3>
                    <p className="text-gray-700">
                      {shippingAddress.line1}<br />
                      {shippingAddress.line2 && <>{shippingAddress.line2}<br /></>}
                      {shippingAddress.city}, {shippingAddress.postal_code}<br />
                      {shippingAddress.state && <>{shippingAddress.state}, </>}
                      {shippingAddress.country}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Update Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={order.status === OrderStatus.PAID ? "primary" : "secondary"}
              onClick={() => handleUpdateStatus(OrderStatus.PAID)}
              disabled={order.status === OrderStatus.PAID || updateStatus.loading}
            >
              Mark as Paid
            </Button>
            <Button
              variant={order.status === OrderStatus.DISPATCHED ? "primary" : "secondary"}
              onClick={() => handleUpdateStatus(OrderStatus.DISPATCHED)}
              disabled={order.status === OrderStatus.DISPATCHED || updateStatus.loading}
            >
              Mark as Dispatched
            </Button>
            <Button
              variant={order.status === OrderStatus.READY ? "primary" : "secondary"}
              onClick={() => handleUpdateStatus(OrderStatus.READY)}
              disabled={order.status === OrderStatus.READY || updateStatus.loading}
            >
              Mark as Ready
            </Button>
            <Button
              variant="danger"
              onClick={() => handleUpdateStatus(OrderStatus.CANCELLED)}
              disabled={order.status === OrderStatus.CANCELLED || updateStatus.loading}
            >
              Cancel Order
            </Button>
          </div>
          
          {updateStatus.loading && (
            <div className="mt-4 flex items-center text-gray-500">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Updating order status...
            </div>
          )}
          
          {updateStatus.error && (
            <div className="mt-4 text-red-500">
              {updateStatus.error}
            </div>
          )}
          
          {updateStatus.success && (
            <div className="mt-4 flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Order status updated successfully
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
