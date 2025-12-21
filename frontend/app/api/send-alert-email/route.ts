/**
 * API Route for Sending Alert Emails
 * Server-side endpoint to send emails via Resend API
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateEmailTemplate } from '@/lib/email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      transactionId,
      senderName,
      receiverName,
      amount,
      transactionType,
      fraudProbability,
      decision,
      riskLevel,
      timestamp,
      shapExplanations,
    } = body

    // Validate required fields
    if (!transactionId || !decision || decision === 'pass') {
      return NextResponse.json(
        { error: 'Invalid request or transaction approved' },
        { status: 400 }
      )
    }

    // Get email configuration
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'alerts@clovershield.com'
    const toEmail =
      process.env.RESEND_TO_EMAIL || 'security@clovershield.com'

    // Generate email HTML
    const emailHtml = generateEmailTemplate({
      transactionId,
      senderName: senderName || 'Unknown',
      receiverName: receiverName || 'Unknown',
      amount,
      transactionType,
      fraudProbability,
      decision,
      riskLevel,
      timestamp,
      shapExplanations,
    })

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `CloverShield Alerts <${fromEmail}>`,
      to: [toEmail],
      subject: `🚨 ${decision === 'block' ? 'BLOCKED' : 'WARNING'}: Transaction ${transactionId} - ${(fraudProbability * 100).toFixed(1)}% Fraud Risk`,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend API error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    })
  } catch (error: any) {
    console.error('Email API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

