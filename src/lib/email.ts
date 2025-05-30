interface EmailParams {
  to: string
  subject: string
  text: string
}

export async function sendEmail({ to, subject, text }: EmailParams) {
  // TODO: Implement actual email sending logic
  console.log('Sending email:', { to, subject, text })
}
