import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (resendClient) return resendClient

  const config = useRuntimeConfig()
  if (!config.resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY not configured — emails will be skipped')
    return null
  }

  resendClient = new Resend(config.resendApiKey as string)
  return resendClient
}

export interface SendInvitationEmailInput {
  to: string
  inviterName: string
  role: string
  company: string
  invitationCode: string
  message?: string
  expiresAt: string
}

export async function sendInvitationEmail(input: SendInvitationEmailInput): Promise<boolean> {
  const client = getResendClient()
  const config = useRuntimeConfig()

  if (!client) {
    console.log('📧 [Email] Skipped (no API key):', input.to)
    return false
  }

  const acceptUrl = `${config.appUrl}/invite/accept?code=${input.invitationCode}`
  const expiryDate = new Date(input.expiresAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  try {
    await client.emails.send({
      from: config.resendFromEmail as string,
      to: input.to,
      subject: `You're invited to StreamHub — ${input.company}`,
      html: generateInvitationHtml({ ...input, acceptUrl, expiryDate })
    })

    console.log('✅ [Email] Sent invitation to:', input.to)
    return true
  } catch (error) {
    console.error('❌ [Email] Failed to send:', error)
    return false
  }
}

function generateInvitationHtml(data: {
  to: string
  inviterName: string
  role: string
  company: string
  message?: string
  acceptUrl: string
  expiryDate: string
  invitationCode: string
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; }
      .info { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
      .info-label { font-weight: 600; color: #666; }
      .btn { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
      .code { background: #e8f4fd; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 18px; text-align: center; letter-spacing: 2px; margin: 12px 0; }
      .footer { padding: 16px; text-align: center; color: #999; font-size: 12px; }
      .message { background: #fff3cd; padding: 12px; border-radius: 4px; margin: 12px 0; font-style: italic; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>StreamHub</h1>
      <p style="margin: 4px 0 0; opacity: 0.8;">Dashboard Management System</p>
    </div>
    <div class="content">
      <h2>You've been invited!</h2>
      <p><strong>${data.inviterName}</strong> has invited you to join StreamHub.</p>

      ${data.message ? `<div class="message">"${data.message}"</div>` : ''}

      <div class="info">
        <div class="info-row"><span class="info-label">Role</span><span>${data.role}</span></div>
        <div class="info-row"><span class="info-label">Company</span><span>${data.company}</span></div>
        <div class="info-row"><span class="info-label">Expires</span><span>${data.expiryDate}</span></div>
      </div>

      <div style="text-align: center;">
        <a href="${data.acceptUrl}" class="btn">Accept Invitation</a>
      </div>

      <p style="text-align: center; color: #666; font-size: 14px;">Or use this invitation code:</p>
      <div class="code">${data.invitationCode}</div>
    </div>
    <div class="footer">
      <p>This invitation expires on ${data.expiryDate}.</p>
      <p>If you didn't expect this invitation, you can safely ignore it.</p>
    </div>
  </body>
  </html>
  `
}
