/**
 * Email Integration
 * Resend API for sending email notifications
 * Triggers emails when transactions are flagged as BLOCK or WARN
 */

/**
 * Send email notification for flagged transaction
 */
export const sendTransactionAlertEmail = async (data: {
  transactionId: string
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  amount: number
  transactionType: string
  fraudProbability: number
  decision: 'pass' | 'warn' | 'block'
  riskLevel: string
  timestamp: string
  shapExplanations?: Array<{
    feature: string
    shap: number
    shap_abs: number
  }>
}) => {
  // Only send emails for BLOCK or WARN decisions
  if (data.decision === 'pass') {
    return { success: false, reason: 'Transaction approved, no alert needed' }
  }

  const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY
  const fromEmail = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'alerts@clovershield.com'
  const toEmail = process.env.NEXT_PUBLIC_RESEND_TO_EMAIL || 'security@clovershield.com'

  if (!resendApiKey) {
    console.warn('Resend API key not found. Email notification skipped.')
    return { success: false, reason: 'Resend API key not configured' }
  }

  try {
    // Call Next.js API route (server-side) to send email
    const response = await fetch('/api/send-alert-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: data.transactionId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderName: data.senderName,
        receiverName: data.receiverName,
        amount: data.amount,
        transactionType: data.transactionType,
        fraudProbability: data.fraudProbability,
        decision: data.decision,
        riskLevel: data.riskLevel,
        timestamp: data.timestamp,
        shapExplanations: data.shapExplanations,
      }),
    })

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, messageId: result.messageId }
  } catch (error: any) {
    console.error('Failed to send email notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate email HTML template
 */
export const generateEmailTemplate = (data: {
  transactionId: string
  senderName: string
  receiverName: string
  amount: number
  transactionType: string
  fraudProbability: number
  decision: 'warn' | 'block'
  riskLevel: string
  timestamp: string
  shapExplanations?: Array<{
    feature: string
    shap: number
    shap_abs: number
  }>
}) => {
  const isBlock = data.decision === 'block'
  const alertColor = isBlock ? '#FF4444' : '#FFD700'
  const alertTitle = isBlock ? '🚨 TRANSACTION BLOCKED' : '⚠️ TRANSACTION REQUIRES REVIEW'
  const alertMessage = isBlock
    ? 'This transaction has been automatically blocked due to high fraud risk.'
    : 'This transaction requires manual review due to elevated fraud risk indicators.'

  const formatCurrency = (amount: number) => {
    return `৳ ${amount.toLocaleString('en-BD')}`
  }

  const topRiskFactors = data.shapExplanations
    ?.slice(0, 5)
    .map((exp) => exp.feature)
    .join(', ') || 'N/A'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alertTitle}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%); padding: 30px 20px; text-align: center;">
      <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: bold;">🛡️ CloverShield</h1>
      <p style="color: #A0AEC0; margin: 10px 0 0 0; font-size: 14px;">Fraud Detection Alert</p>
    </div>

    <!-- Alert Banner -->
    <div style="background-color: ${alertColor}; padding: 20px; text-align: center;">
      <h2 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: bold;">${alertTitle}</h2>
      <p style="color: #FFFFFF; margin: 10px 0 0 0; font-size: 16px;">${alertMessage}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <!-- Transaction Details -->
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #0A0E27; margin-top: 0; font-size: 18px; font-weight: bold; border-bottom: 2px solid #0A0E27; padding-bottom: 10px;">
          Transaction Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%;">Transaction ID:</td>
            <td style="padding: 8px 0; color: #333; font-family: monospace;">${data.transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Sender:</td>
            <td style="padding: 8px 0; color: #333;">${data.senderName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Receiver:</td>
            <td style="padding: 8px 0; color: #333;">${data.receiverName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold; font-size: 18px;">${formatCurrency(data.amount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Type:</td>
            <td style="padding: 8px 0; color: #333;">${data.transactionType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Timestamp:</td>
            <td style="padding: 8px 0; color: #333;">${new Date(data.timestamp).toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Risk Assessment -->
      <div style="background-color: #fff3cd; border-left: 4px solid ${alertColor}; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #0A0E27; margin-top: 0; font-size: 18px; font-weight: bold;">
          Risk Assessment
        </h3>
        <div style="margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #666; font-weight: bold;">Fraud Probability:</span>
            <span style="color: ${alertColor}; font-weight: bold; font-size: 20px;">${(data.fraudProbability * 100).toFixed(1)}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #666; font-weight: bold;">Risk Level:</span>
            <span style="color: ${alertColor}; font-weight: bold; text-transform: uppercase;">${data.riskLevel}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666; font-weight: bold;">Decision:</span>
            <span style="color: ${alertColor}; font-weight: bold; text-transform: uppercase;">${data.decision}</span>
          </div>
        </div>
      </div>

      <!-- Risk Factors -->
      ${data.shapExplanations && data.shapExplanations.length > 0 ? `
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #0A0E27; margin-top: 0; font-size: 18px; font-weight: bold; border-bottom: 2px solid #0A0E27; padding-bottom: 10px;">
          Top Risk Factors
        </h3>
        <p style="color: #666; margin: 10px 0;">${topRiskFactors}</p>
      </div>
      ` : ''}

      <!-- Action Required -->
      <div style="background-color: #e7f3ff; border-left: 4px solid #3B82F6; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #0A0E27; margin-top: 0; font-size: 18px; font-weight: bold;">
          ${isBlock ? 'Action Taken' : 'Action Required'}
        </h3>
        <p style="color: #666; margin: 10px 0;">
          ${isBlock 
            ? 'This transaction has been automatically blocked. Please review the transaction details and take appropriate action if needed.'
            : 'Please review this transaction manually and determine whether to approve or block it.'}
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #999; font-size: 12px; margin: 5px 0;">
          This is an automated alert from CloverShield Fraud Detection System
        </p>
        <p style="color: #999; font-size: 12px; margin: 5px 0;">
          Built by Team Clover Crew for MXB2026 Rajshahi
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

