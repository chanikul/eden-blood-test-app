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

interface OrderConfirmationEmailProps {
  name: string;
  orderId: string;
  testName: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  orderStatus: string;
  orderDate: string;
}

export default function OrderConfirmationEmail({
  name,
  orderId,
  testName,
  shippingAddress,
  orderStatus,
  orderDate,
}: OrderConfirmationEmailProps) {
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
      <Preview>Your Eden Clinic Blood Test Order is Confirmed - #{orderId}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.logo}>✅</Text>
          <Text style={styles.heading}>Order Confirmation</Text>
          <Text style={styles.text}>
            Dear {name},<br />
            Thank you for choosing Eden Clinic. Your blood test order has been confirmed.
          </Text>

          <Section style={styles.orderBox}>
            <Text style={styles.subheading}>Order Details</Text>
            <Text style={styles.text}>
              <strong>Order ID:</strong> {orderId}<br />
              <strong>Test Type:</strong> {testName}<br />
              <strong>Status:</strong> <Text style={{ ...styles.text, color: '#059669' }}>{orderStatus}</Text><br />
              <strong>Order Date:</strong> {orderDate}
            </Text>
          </Section>

          <Section style={styles.addressBox}>
            <Text style={styles.subheading}>Shipping Address</Text>
            <Text style={styles.text}>{formatAddress(shippingAddress)}</Text>
          </Section>

          <Section style={styles.stepsBox}>
            <Text style={styles.subheading}>Next Steps</Text>
            <ol style={styles.list}>
              <li>We'll send your blood test kit to the provided address</li>
              <li>Follow the instructions in the kit to collect your sample</li>
              <li>Use the prepaid return envelope to send your sample back</li>
              <li>We'll notify you when your results are ready</li>
            </ol>
          </Section>

          <Button href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://edenclinicformen.com'}/login`} style={styles.button}>
            View Order Details
          </Button>

          <Hr style={styles.hr} />
          
          <Text style={styles.help}>
            Need help? <Link href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://edenclinicformen.com'}/support`} style={styles.link}>Contact our support team</Link>
          </Text>

          <Text style={styles.footer}>
            Eden Clinic<br />
            Registered in England & Wales<br />
            CQC Registration: CQC123456
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
    margin: '0 0 24px',
    color: '#1a365d',
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
    marginTop: '24px',
    marginBottom: '24px',
  },
  addressBox: {
    backgroundColor: '#f7fafc',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  stepsBox: {
    backgroundColor: '#f0fdf4',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #86efac',
    marginBottom: '32px',
  },
  list: {
    margin: '0',
    paddingLeft: '24px',
    lineHeight: '28px',
    color: '#4a5568',
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    marginBottom: '32px',
    fontWeight: '600',
  },
  hr: {
    borderTop: '1px solid #e2e8f0',
    margin: '32px 0',
  },
  help: {
    fontSize: '14px',
    color: '#718096',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  footer: {
    fontSize: '12px',
    color: '#718096',
    textAlign: 'center' as const,
    lineHeight: '18px',
  },
};
