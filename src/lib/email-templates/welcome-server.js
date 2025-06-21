// Server-side implementation of welcome email generator using plain HTML
// This avoids the client/server component boundary issue completely

/**
 * Generate a welcome email with account details
 * @param {Object} props - Email properties
 * @param {string} props.name - User's name
 * @param {string} props.email - User's email
 * @param {string} props.password - Temporary password
 * @param {string} props.orderId - Order ID (optional)
 * @param {string} props.testName - Test name (optional)
 * @returns {Object} Email subject and HTML content
 */
exports.generateWelcomeEmailServer = async function(props) {
  const { name, email, password: tempPassword, orderId, testName } = props;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://edenclinicformen.com';
  
  // Create HTML email template without React components
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Welcome to Eden Clinic</title>
        <style>
          @media only screen and (max-width: 620px) {
            table.body h1 {
              font-size: 28px !important;
              margin-bottom: 10px !important;
            }
            table.body p,
            table.body ul,
            table.body ol,
            table.body td,
            table.body span,
            table.body a {
              font-size: 16px !important;
            }
            table.body .wrapper,
            table.body .article {
              padding: 10px !important;
            }
            table.body .content {
              padding: 0 !important;
            }
            table.body .container {
              padding: 0 !important;
              width: 100% !important;
            }
            table.body .main {
              border-left-width: 0 !important;
              border-radius: 0 !important;
              border-right-width: 0 !important;
            }
            table.body .btn table {
              width: 100% !important;
            }
            table.body .btn a {
              width: 100% !important;
            }
            table.body .img-responsive {
              height: auto !important;
              max-width: 100% !important;
              width: auto !important;
            }
          }
          @media all {
            .ExternalClass {
              width: 100%;
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
              line-height: 100%;
            }
            .apple-link a {
              color: inherit !important;
              font-family: inherit !important;
              font-size: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
              text-decoration: none !important;
            }
            #MessageViewBody a {
              color: inherit;
              text-decoration: none;
              font-size: inherit;
              font-family: inherit;
              font-weight: inherit;
              line-height: inherit;
            }
            .btn-primary table td:hover {
              background-color: #3498db !important;
            }
            .btn-primary a:hover {
              background-color: #3498db !important;
              border-color: #3498db !important;
            }
          }
        </style>
      </head>
      <body style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
        <span style="display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; color: #fff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          Welcome to Eden Clinic – Your account is ready
        </span>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f6f6; width: 100%;" width="100%" bgcolor="#f6f6f6">
          <tr>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
            <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; max-width: 580px; padding: 10px; width: 580px; margin: 0 auto;" width="580" valign="top">
              <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">
                <!-- START CENTERED WHITE CONTAINER -->
                <table role="presentation" class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border-radius: 3px; width: 100%;" width="100%">
                  <!-- START MAIN CONTENT AREA -->
                  <tr>
                    <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;" valign="top">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                        <tr>
                          <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                            <div style="font-size: 24px; margin-bottom: 15px; text-align: center;">🩺</div>
                            <h1 style="color: #000000; font-family: sans-serif; font-weight: 700; line-height: 1.4; margin: 0; margin-bottom: 30px; font-size: 35px; text-align: center; text-transform: capitalize;">Welcome to Eden Clinic</h1>
                            <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Dear ${name},</p>
                            <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Thank you for choosing Eden Clinic. Your account has been successfully created.</p>
                            
                            <hr style="border: 0; border-bottom: 1px solid #f6f6f6; margin: 20px 0;" />
                            <h2 style="color: #000000; font-family: sans-serif; font-weight: 600; line-height: 1.4; margin: 0; margin-bottom: 15px; font-size: 18px;">Your Login Details</h2>
                            <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Email: <strong>${email}</strong></p>
                            <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Password: <strong>${tempPassword}</strong></p>
                            
                            <hr style="border: 0; border-bottom: 1px solid #f6f6f6; margin: 20px 0;" />
                            <h2 style="color: #000000; font-family: sans-serif; font-weight: 600; line-height: 1.4; margin: 0; margin-bottom: 15px; font-size: 18px;">Next Steps</h2>
                            <ul style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px; padding-left: 20px;">
                              <li style="margin-bottom: 10px;">Login to your patient portal</li>
                              <li style="margin-bottom: 10px;">Change your temporary password</li>
                              <li style="margin-bottom: 10px;">Complete your profile setup</li>
                              <li style="margin-bottom: 10px;">Review your test order</li>
                            </ul>
                            
                            <hr style="border: 0; border-bottom: 1px solid #f6f6f6; margin: 20px 0;" />
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; box-sizing: border-box; width: 100%;" width="100%">
                              <tbody>
                                <tr>
                                  <td align="center" style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 15px;" valign="top">
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
                                      <tbody>
                                        <tr>
                                          <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; border-radius: 5px; text-align: center; background-color: #2563eb;" valign="top" align="center" bgcolor="#2563eb">
                                            <a href="${baseUrl}/login" target="_blank" style="border: solid 1px #2563eb; border-radius: 5px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; text-transform: capitalize; background-color: #2563eb; border-color: #2563eb; color: #ffffff;">Login to Your Account</a>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            
                            <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px; text-align: center;">
                              Need help? <a href="${baseUrl}/support" style="color: #2563eb; text-decoration: underline;">Contact support</a>
                            </p>
                            
                            <hr style="border: 0; border-bottom: 1px solid #f6f6f6; margin: 20px 0;" />
                            <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px; color: #999999; text-align: center;">
                              &copy; ${new Date().getFullYear()} Eden Clinic. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>
  `;
  
  return {
    subject: 'Welcome to Eden Clinic – Your account is ready',
    html: html,
  };
};
