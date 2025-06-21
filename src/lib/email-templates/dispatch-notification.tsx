import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface DispatchNotificationEmailProps {
  name: string;
  testName: string;
  orderId: string;
  dispatchDate: string;
}

export const DispatchNotificationEmail = ({
  name,
  testName,
  orderId,
  dispatchDate,
}: DispatchNotificationEmailProps) => {
  const previewText = `Your Eden Clinic Blood Test Kit has been dispatched`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.edenclinicformen.com'}/images/logo.png`}
            width="170"
            height="50"
            alt="Eden Clinic"
            style={logo}
          />
          <Heading style={heading}>Your Blood Test Kit Has Been Dispatched</Heading>
          
          <Section style={section}>
            <Text style={text}>Dear {name},</Text>
            <Text style={text}>
              We're pleased to inform you that your blood test kit has been dispatched and is on its way to you.
            </Text>
            
            <Section style={detailsContainer}>
              <Text style={detailsHeading}>Order Details:</Text>
              <Text style={detailsText}>
                <strong>Test Type:</strong> {testName}
              </Text>
              <Text style={detailsText}>
                <strong>Order ID:</strong> {orderId}
              </Text>
              <Text style={detailsText}>
                <strong>Dispatch Date:</strong> {dispatchDate}
              </Text>
            </Section>
            
            <Text style={text}>
              You should receive your kit within 2-3 working days. Once you receive it, please follow the instructions 
              included in the kit to complete your blood test.
            </Text>
            
            <Text style={text}>
              If you have any questions or need assistance, please don't hesitate to contact our support team at{' '}
              <Link href="mailto:support@edenclinicformen.com" style={link}>
                support@edenclinicformen.com
              </Link>
              .
            </Text>
            
            <Text style={text}>
              Thank you for choosing Eden Clinic for your health needs.
            </Text>
            
            <Text style={text}>Best regards,</Text>
            <Text style={text}>The Eden Clinic Team</Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Eden Clinic. All rights reserved.
            </Text>
            <Text style={footerText}>
              This email was sent to you as part of your order with Eden Clinic.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '5px',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
};

const logo = {
  margin: '0 auto',
  marginBottom: '20px',
  display: 'block',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
  textAlign: 'center' as const,
};

const section = {
  padding: '0 20px',
};

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#484848',
};

const detailsContainer = {
  padding: '15px',
  backgroundColor: '#f9f9f9',
  borderRadius: '5px',
  margin: '20px 0',
};

const detailsHeading = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '10px',
  color: '#484848',
};

const detailsText = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '5px 0',
  color: '#484848',
};

const link = {
  color: '#1a73e8',
  textDecoration: 'underline',
};

const footer = {
  borderTop: '1px solid #e6ebf1',
  padding: '20px 20px 0',
  marginTop: '20px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#8898aa',
  textAlign: 'center' as const,
};

export default DispatchNotificationEmail;
