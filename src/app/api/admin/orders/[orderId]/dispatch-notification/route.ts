import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Send dispatch notification email
    await sendEmail({
      to: order.patientEmail,
      subject: 'Your Eden Clinic Blood Test Kit has been dispatched',
      text: `Dear ${order.patientName},\n\nYour blood test kit has been dispatched and is on its way to you.\n\nTest Type: ${order.testName}\n\nBest regards,\nEden Clinic Team`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending dispatch notification:', error)
    return NextResponse.json(
      { error: 'Failed to send dispatch notification' },
      { status: 500 }
    )
  }
}
