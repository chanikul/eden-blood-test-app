export interface EmailTemplateResponse {
  subject: string;
  html: string;
}

export interface EmailShippingAddress {
  line1: string;
  line2?: string | undefined;
  city: string;
  postcode: string;
  country?: string;
}

// Make the shipping address optional in these interfaces for better flexibility

export interface OrderConfirmationEmailProps {
  name: string;
  orderId: string;
  testName: string;
  shippingAddress?: EmailShippingAddress;
  orderStatus?: string;
  orderDate?: string;
  isHomeKit?: boolean;
}

export interface AdminNotificationEmailProps {
  email: string;
  name: string;
  orderId: string;
  testName: string;
  shippingAddress?: EmailShippingAddress | string;
  notes?: string;
  paymentStatus?: string;
  dateOfBirth?: string;
}

export interface WelcomeEmailProps {
  email: string;
  name: string;
  password: string;
  order: {
    id: string;
    patientName: string;
    patientEmail: string;
    bloodTest?: {
      name: string;
    };
  };
}
