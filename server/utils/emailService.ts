import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResendApiKey(): string {
  // Try runtimeConfig first (Nuxt convention), then process.env as fallback
  const config = useRuntimeConfig()
  return (config.resendApiKey as string)
    || process.env.NUXT_RESEND_API_KEY
    || process.env.RESEND_API_KEY
    || ''
}

function getResendFromEmail(): string {
  const config = useRuntimeConfig()
  return (config.resendFromEmail as string)
    || process.env.NUXT_RESEND_FROM_EMAIL
    || process.env.RESEND_FROM_EMAIL
    || 'noreply@streamwash.com'
}

function getAppUrl(): string {
  const config = useRuntimeConfig()
  const url = (config.appUrl as string)
    || process.env.NUXT_APP_URL
    || process.env.APP_URL
  if (!url) {
    if (process.dev) return 'http://localhost:3000'
    throw new Error('APP_URL is not configured — set NUXT_APP_URL in production environment')
  }
  return url
}

function getResendClient(): Resend | null {
  if (resendClient) return resendClient

  const apiKey = getResendApiKey()
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY not configured — emails will be skipped')
    return null
  }

  resendClient = new Resend(apiKey)
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

    if (!client) {
        console.log('📧 [Email] Skipped (no API key):', input.to)
        return false
    }

    const acceptUrl = `${getAppUrl()}/invite/accept?code=${input.invitationCode}`
    const expiryDate = new Date(input.expiresAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    try {
        await client.emails.send({
            from: getResendFromEmail(),
            to: input.to,
            subject: `คุณได้รับคำเชิญเข้าร่วม Dashboard Hub — ${input.company}`,
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
      .header { background: linear-gradient(135deg, #2d3389 0%, #1f2461 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.5px; }
      .content { background: #f4f5fb; padding: 24px; border: 1px solid #dde0f0; }
      .info { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e0e5f3; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e5f3; }
      .info-label { font-weight: 600; color: #2d3389; }
      .btn { display: inline-block; background: #2d3389; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
      .code { background: #e0e5f3; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 18px; text-align: center; letter-spacing: 2px; margin: 12px 0; color: #1f2461; }
      .footer { padding: 16px; text-align: center; color: #999; font-size: 12px; }
      .message { background: #fff3cd; padding: 12px; border-radius: 4px; margin: 12px 0; font-style: italic; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Dashboard Hub</h1>
      <p style="margin: 4px 0 0; opacity: 0.8;">ระบบจัดการ Dashboard</p>
    </div>
    <div class="content">
      <h2>คุณได้รับคำเชิญ!</h2>
      <p><strong>${data.inviterName}</strong> ได้เชิญคุณเข้าร่วม Dashboard Hub</p>

      ${data.message ? `<div class="message">"${data.message}"</div>` : ''}

      <table class="info" width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e0e5f3;">
        <tr style="border-bottom: 1px solid #e0e5f3;"><td style="padding: 8px 0; font-weight: 600; color: #2d3389;">บทบาท:&nbsp;</td><td style="padding: 8px 0;">${data.role}</td></tr>
        <tr style="border-bottom: 1px solid #e0e5f3;"><td style="padding: 8px 0; font-weight: 600; color: #2d3389;">บริษัท:&nbsp;</td><td style="padding: 8px 0;">${data.company}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600; color: #2d3389;">หมดอายุ:&nbsp;</td><td style="padding: 8px 0;">${data.expiryDate}</td></tr>
      </table>

      <div style="text-align: center;">
        <a href="${data.acceptUrl}" class="btn" style="color: #ffffff !important; display: inline-block; background: #2d3389; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0;">ยืนยันคำเชิญ</a>
      </div>

      <div style="margin-top: 20px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e0e5f3;">
        <p style="color: #666; font-size: 14px; margin: 0 0 8px; text-align: center;">หรือใช้รหัสคำเชิญด้านล่าง:</p>
        <div class="code">${data.invitationCode}</div>
        <p style="color: #888; font-size: 12px; margin: 8px 0 0; text-align: center;">คัดลอกรหัสนี้แล้วนำไปกรอกที่หน้า "ยืนยันคำเชิญ" ในระบบ Dashboard Hub<br>ใช้ในกรณีที่ปุ่มด้านบนไม่สามารถใช้งานได้</p>
      </div>
    </div>
    <div class="footer">
      <p>คำเชิญนี้จะหมดอายุในวันที่ ${data.expiryDate}</p>
      <p>หากคุณไม่ได้คาดหวังคำเชิญนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้</p>
    </div>
  </body>
  </html>
  `
}
