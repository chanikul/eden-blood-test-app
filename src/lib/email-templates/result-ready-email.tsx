import { render } from '@react-email/render';
import { sendEmail } from '@/lib/email';
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Link, 
  Preview, 
  Section, 
  Text 
} from '@react-email/components';

interface ResultReadyEmailProps {
  name: string;
  testName: string;
}

export const ResultReadyEmail = ({ name, testName }: ResultReadyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Eden Clinic test results are ready</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoContainer}>
            <img
              src="https://edenclinic.co.uk/logo.png"
              alt="Eden Clinic"
              width="150"
              height="40"
              style={styles.logo}
            />
          </Section>
          <Heading style={styles.heading}>Your Test Results Are Ready</Heading>
          <Text style={styles.text}>Hello {name},</Text>
          <Text style={styles.text}>
            Good news! Your {testName} results are now available to view in your Eden Clinic dashboard.
          </Text>
          <Text style={styles.text}>
            Please log in to your account to view and download your results.
          </Text>
          <Section style={styles.buttonContainer}>
            <Link
              href="https://edenclinic.co.uk/client/blood-tests"
              style={styles.button}
            >
              View My Results
            </Link>
          </Section>
          <Text style={styles.text}>
            If you have any questions about your results, please don't hesitate to contact our support team.
          </Text>
          <Text style={styles.text}>
            Best regards,<br />
            The Eden Clinic Team
          </Text>
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Eden Clinic. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              <Link
                href="https://edenclinic.co.uk/bloodtest-support"
                style={styles.footerLink}
              >
                Get Support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0',
    width: '580px',
  },
  logoContainer: {
    marginBottom: '24px',
  },
  logo: {
    margin: '0 auto',
    display: 'block',
  },
  heading: {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  text: {
    color: '#333',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: '4px',
    color: '#fff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  footer: {
    borderTop: '1px solid #e6ebf1',
    marginTop: '32px',
    paddingTop: '16px',
  },
  footerText: {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: '20px',
    textAlign: 'center' as const,
    margin: '8px 0',
  },
  footerLink: {
    color: '#10b981',
    textDecoration: 'underline',
  },
};

export async function sendResultReadyEmail({
  email,
  name,
  testName,
}: {
  email: string;
  name: string;
  testName: string;
}): Promise<void> {
  const emailHtml = render(
    <ResultReadyEmail
      name={name}
      testName={testName}
    />
  );

  await sendEmail({
    to: email,
    subject: "Your Eden Clinic test results are ready",
    html: emailHtml,
  });
}
