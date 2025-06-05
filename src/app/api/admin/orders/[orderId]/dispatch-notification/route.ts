import { prisma } from '../../../../../../lib/prisma'
import { sendDispatchNotificationEmail } from '../../../../../../lib/services/email'
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

    // Send styled dispatch notification email using the email service
    await sendDispatchNotificationEmail({
      name: order.patientName,
      email: order.patientEmail,
      testName: order.testName,
      orderId: order.id,
      dispatchDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    })
    
    console.log('✅ EMAIL: Dispatch notification sent to:', order.patientEmail)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending dispatch notification:', error)
    return NextResponse.json(
      { error: 'Failed to send dispatch notification' },
      { status: 500 }
    )
  }
}
