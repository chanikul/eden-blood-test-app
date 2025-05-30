interface EmailLayoutProps {
  subject: string;
  content: string;
  showDashboardButton?: boolean;
}

export const emailStyles = `
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f3f4f6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .header {
    background-color: #1a365d;
    color: white;
    padding: 24px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  }
  .content {
    padding: 32px 24px;
    background-color: #ffffff;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .section {
    margin-bottom: 30px;
    padding: 20px;
    background-color: #f8fafc;
    border-radius: 8px;
  }
  .button {
    display: inline-block;
    padding: 12px 24px;
    background-color: #2563eb;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    margin: 10px 0;
    text-align: center;
  }
  .footer {
    text-align: center;
    padding: 20px;
    color: #666;
    font-size: 14px;
    margin-top: 20px;
  }
  .alert {
    background-color: #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 15px;
    margin: 20px 0;
  }
  h1 { font-size: 24px; margin: 0; }
  h2 { font-size: 20px; color: #1a365d; margin-bottom: 16px; }
  h3 { font-size: 18px; color: #2d3748; margin-bottom: 12px; }
  p { margin-bottom: 16px; }
  .monospace {
    font-family: 'Courier New', monospace;
    white-space: pre-wrap;
  }
`;

export function generateEmailLayout({ subject, content, showDashboardButton = false }: EmailLayoutProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://edenclinic.co.uk/logo.png" alt="Eden Clinic" height="40" style="margin-bottom: 16px;">
          <h1>${subject}</h1>
        </div>
        
        <div class="content">
          ${content}
          
          ${showDashboardButton ? `
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://edenclinic.co.uk/admin" class="button">
                Go to Dashboard
              </a>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Need help? Contact our support team:</p>
            <p>📧 <a href="mailto:support@edenclinic.co.uk">support@edenclinic.co.uk</a></p>
            <p>📞 +44 (0)20 1234 5678</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
              © ${new Date().getFullYear()} Eden Clinic. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
