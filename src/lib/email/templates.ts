interface PasswordResetEmailData {
  to: string;
  name: string;
  resetToken: string;
}

interface WelcomeEmailData {
  email: string;
  name: string;
  password: string;
  orderId: string;
  testName: string;
}

export function getPasswordResetEmailTemplate(data: PasswordResetEmailData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${data.resetToken}`;

  return {
    to: data.to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Eden Clinic - Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background-color: #2563eb; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset Request</h1>
            </div>

            <!-- Content -->
            <div style="padding: 24px;">
              <p style="color: #1f2937; font-size: 16px; line-height: 24px;">
                Dear ${data.name},
              </p>

              <p style="color: #1f2937; font-size: 16px; line-height: 24px;">
                We received a request to reset your Eden Clinic account password.
              </p>

              <!-- Reset Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; 
                          padding: 12px 24px; border-radius: 6px; font-weight: 500; transition: background-color 0.2s;">
                  Reset Password
                </a>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  🔒 This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 20px;">
                If you have any questions, please contact us at 
                <a href="mailto:support@edenclinic.co.uk" style="color: #2563eb;">support@edenclinic.co.uk</a>
              </p>

              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">

              <!-- Footer -->
              <div style="text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; line-height: 16px; margin: 0;">
                  Eden Clinic<br>
                  Registered in England & Wales<br>
                  CQC Registration: CQC123456
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  };
}

export function getWelcomeEmailTemplate(data: WelcomeEmailData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return {
    to: data.email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Welcome to Eden Clinic - Your Account is Ready',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background-color: #2563eb; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to Eden Clinic</h1>
            </div>

            <!-- Content -->
            <div style="padding: 24px;">
              <p style="color: #1f2937; font-size: 16px; line-height: 24px;">
                Dear ${data.name},
              </p>

              <p style="color: #1f2937; font-size: 16px; line-height: 24px;">
                Thank you for choosing Eden Clinic. Your account has been created successfully.
              </p>

              <!-- Login Details Box -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0;">Your Login Details</h2>
                <p style="color: #4b5563; margin: 4px 0;">Email: <strong>${data.email}</strong></p>
                <p style="color: #4b5563; margin: 4px 0;">Password: <strong>${data.password}</strong></p>
              </div>

              <!-- Next Steps Box -->
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0;">Next Steps</h2>
                <ol style="color: #4b5563; margin: 0; padding-left: 24px;">
                  <li style="margin-bottom: 8px;">Login to your patient portal</li>
                  <li style="margin-bottom: 8px;">Change your temporary password</li>
                  <li style="margin-bottom: 8px;">Complete your profile setup</li>
                  <li style="margin-bottom: 0;">Review your test order</li>
                </ol>
              </div>

              <!-- Order Details Box -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0;">Your Test Order</h2>
                <p style="color: #4b5563; margin: 4px 0;">Order ID: <strong>#${data.orderId}</strong></p>
                <p style="color: #4b5563; margin: 4px 0;">Test: <strong>${data.testName}</strong></p>
                <p style="color: #4b5563; margin: 4px 0;">Status: <strong>Confirmed</strong></p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${baseUrl}/login" 
                   style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; 
                          padding: 12px 24px; border-radius: 6px; font-weight: 500; transition: background-color 0.2s;">
                  Login to Your Account
                </a>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  🔒 For your security, please change your password after your first login.
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 20px;">
                If you have any questions, please contact us at 
                <a href="mailto:support@edenclinic.co.uk" style="color: #2563eb;">support@edenclinic.co.uk</a>
              </p>

              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">

              <!-- Footer -->
              <div style="text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; line-height: 16px; margin: 0;">
                  Eden Clinic<br>
                  Registered in England & Wales<br>
                  CQC Registration: CQC123456
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  };
}
