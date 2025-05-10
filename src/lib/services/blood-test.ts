

export interface BloodTestOrderFormData {
  fullName: string;
  email: string;
  dateOfBirth: string;
  mobile?: string;
  testSlug: string;
  notes?: string;
}

export interface BloodTestOrderResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  checkoutUrl?: string;
}

export async function submitBloodTestOrder(data: BloodTestOrderFormData): Promise<BloodTestOrderResponse> {
  try {
    console.log('Making API request to /api/order-blood-test');
    console.log('Request data:', data);

    const response = await fetch('/api/order-blood-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
      console.error('API error:', result);
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error in submitBloodTestOrder:', error);
    throw error;
  }
}
