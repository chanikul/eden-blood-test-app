import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Preview } from '@react-email/preview';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Text } from '@react-email/text';
import { Link } from '@react-email/link';
import { Button } from '@react-email/button';
import { Hr } from '@react-email/hr';
import { Section } from '@react-email/section';

interface AdminNotificationEmailProps {
  orderId: string;
  name: string;
  email: string;
  testName: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  notes?: string;
  orderDate: string;
  paymentStatus: string;
}

export default function AdminNotificationEmail({
  orderId,
  name,
  email,
  testName,
  shippingAddress,
  notes,
  orderDate,
  paymentStatus,
}: AdminNotificationEmailProps) {
  const formatAddress = (address: typeof shippingAddress) => {
    return [
      address.line1,
      address.line2,
      address.city,
      address.postcode,
    ].filter(Boolean).join(', ');
  };

  return (
    <Html>
      <Head />
      <Preview>New Blood Test Order #{orderId} from {name}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.logo}>📩</Text>
          <Text style={styles.heading}>New Order Received</Text>
          <Text style={styles.timestamp}>{orderDate}</Text>

          <Section style={styles.orderBox}>
            <Text style={styles.subheading}>Order Details</Text>
            <Text style={styles.text}>
              <strong>Order ID:</strong> {orderId}<br />
              <strong>Test Type:</strong> {testName}<br />
              <strong>Payment Status:</strong> <Text style={{ 
                ...styles.text, 
                color: paymentStatus === 'paid' ? '#059669' : '#DC2626',
                fontWeight: 'bold',
              }}>
                {paymentStatus.toUpperCase()}
              </Text>
            </Text>
          </Section>

          <Section style={styles.patientBox}>
            <Text style={styles.subheading}>Patient Information</Text>
            <Text style={styles.text}>
              <strong>Name:</strong> {name}<br />
              <strong>Email:</strong> <Link href={`mailto:${email}`} style={styles.link}>{email}</Link>
            </Text>
          </Section>

          <Section style={styles.addressBox}>
            <Text style={styles.subheading}>Shipping Address</Text>
            <Text style={styles.text}>{formatAddress(shippingAddress)}</Text>
          </Section>

          {notes && (
            <Section style={styles.notesBox}>
              <Text style={styles.subheading}>Additional Notes</Text>
              <Text style={styles.text}>{notes}</Text>
            </Section>
          )}

          <Section style={styles.actionsBox}>
            <Button 
              href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.edenclinicformen.com'}/orders/${orderId}`} 
              style={styles.button}
            >
              View Order Details
            </Button>
            <Button 
              href={`mailto:${email}?subject=Eden Clinic for Men Order ${orderId}`} 
              style={styles.secondaryButton}
            >
              Contact Patient
            </Button>
          </Section>

          <Hr style={styles.hr} />
          
          <Text style={styles.footer}>
            This is an automated notification from Eden Clinic's order management system.
            Please do not reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Arial, sans-serif',
    padding: '32px',
  },
  container: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '32px',
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '0 0 8px',
    color: '#1a365d',
  },
  timestamp: {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  subheading: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#2d3748',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#4a5568',
    margin: '0 0 16px',
  },
  orderBox: {
    backgroundColor: '#f0f9ff',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #bae6fd',
    marginBottom: '24px',
  },
  patientBox: {
    backgroundColor: '#fdf2f8',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #fbcfe8',
    marginBottom: '24px',
  },
  addressBox: {
    backgroundColor: '#f7fafc',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  notesBox: {
    backgroundColor: '#fff7ed',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #fed7aa',
    marginBottom: '24px',
  },
  actionsBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '32px',
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    fontWeight: '600',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  hr: {
    borderTop: '1px solid #e2e8f0',
    margin: '32px 0',
  },
  footer: {
    fontSize: '12px',
    color: '#718096',
    textAlign: 'center' as const,
    lineHeight: '18px',
  },
};
