export interface EmailTemplateResponse {
  subject: string;
  html: string;
}

export interface EmailShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}

export interface OrderConfirmationEmailProps {
  name: string;
  orderId: string;
  testName: string;
  shippingAddress: EmailShippingAddress;
  orderStatus?: string;
  orderDate?: string;
  isHomeKit?: boolean;
}

export interface AdminNotificationEmailProps {
  email: string;
  name: string;
  orderId: string;
  testName: string;
  shippingAddress: EmailShippingAddress;
  notes?: string;
  paymentStatus: string;
}

export interface WelcomeEmailProps {
  email: string;
  name: string;
  password: string;
  orderId: string;
  testName: string;
}
