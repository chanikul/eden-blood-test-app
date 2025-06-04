import React from 'react';
import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Preview } from '@react-email/preview';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Text } from '@react-email/text';
import { Link } from '@react-email/link';
import { Button } from '@react-email/button';
import { Hr } from '@react-email/hr';

export function WelcomeEmail({ name, email, tempPassword }: { name: string; email: string; tempPassword: string }) {

  return (
    <Html>
      <Head />
      <Preview>Welcome to Eden Clinic – Your account is ready</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.logo}>🩺</Text>
          <Text style={styles.heading}>Welcome to Eden Clinic</Text>
          <Text style={styles.text}>Dear {name},</Text>
          <Text style={styles.text}>
            Thank you for choosing Eden Clinic. Your account has been successfully created.
          </Text>

          <Hr style={styles.hr} />
          <Text style={styles.subheading}>Your Login Details</Text>
          <Text style={styles.text}>Email: <strong>{email}</strong></Text>
          <Text style={styles.text}>Password: <strong>{tempPassword}</strong></Text>

          <Hr style={styles.hr} />
          <Text style={styles.subheading}>Next Steps</Text>
          <ul style={styles.list}>
            <li>Login to your patient portal</li>
            <li>Change your temporary password</li>
            <li>Complete your profile setup</li>
            <li>Review your test order</li>
          </ul>

          <Hr style={styles.hr} />
          <Button href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://edenclinicformen.com'}/login`} style={styles.button}>Login to Your Account</Button>

          <Text style={styles.help}>
            Need help? <Link href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://edenclinicformen.com'}/support`}>Contact support</Link>
          </Text>

          <Hr style={styles.hr} />
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

export function generateWelcomeEmail(name: string, email: string, tempPassword: string) {
  return {
    subject: 'Welcome to Eden Clinic – Your account is ready',
    html: React.createElement(WelcomeEmail, { name, email, tempPassword }).toString(),
  };
}

export default WelcomeEmail;

const styles = {
  body: { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif', padding: '32px' },
  container: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', textAlign: 'center' as const },
  logo: { fontSize: '32px' },
  heading: { fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' },
  subheading: { fontSize: '18px', fontWeight: '600', marginTop: '24px', marginBottom: '12px' },
  text: { fontSize: '16px', lineHeight: '24px', marginBottom: '12px' },
  list: { textAlign: 'left' as const, paddingLeft: '20px', fontSize: '16px', lineHeight: '24px' },
  button: { marginTop: '24px', backgroundColor: '#2A6DE4', color: '#ffffff', padding: '12px 20px', borderRadius: '4px', textDecoration: 'none' },
  help: { marginTop: '20px', fontSize: '14px' },
  hr: { margin: '24px 0' },
  footer: { fontSize: '12px', color: '#666', marginTop: '40px' },
};
