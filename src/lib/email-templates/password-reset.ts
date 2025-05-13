export function generatePasswordResetEmailHtml(resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a !important;
              color: #ffffff !important;
            }
            .container {
              background-color: #2d2d2d !important;
            }
            .button {
              background-color: #0070f3 !important;
            }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #ffffff;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 20px;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0070f3;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #999999;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_BASE_URL}/images/logo.png" alt="Eden Clinic" class="logo">
            <h1>Reset Your Password</h1>
          </div>
          <p>Hello,</p>
          <p>We received a request to reset your password for your Eden Clinic admin account. Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email.</p>
          <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; font-size: 14px; color: #666666;">${resetUrl}</p>
          <div class="footer">
            <p>Eden Clinic Admin Portal</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
