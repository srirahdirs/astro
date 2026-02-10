/**
 * WhatsApp Cloud API - send document automatically (no user click).
 * Requires: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID in env.
 * Get these from Meta for Developers > Your App > WhatsApp > API Setup.
 */

const API_VERSION = 'v22.0';
const BASE = 'https://graph.facebook.com';

export type SendDocumentResult = { ok: true; messageId?: string } | { ok: false; error: string };

async function sendWhatsAppMessage(
  token: string,
  phoneNumberId: string,
  to: string,
  body: object
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const res = await fetch(`${BASE}/${API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = data?.error?.message || data?.error?.error_user_msg || JSON.stringify(data?.error) || `HTTP ${res.status}`;
    console.error('[WhatsApp] Send failed:', { to, status: res.status, error: data?.error });
    return { ok: false, error: errMsg };
  }
  const messageId = data?.messages?.[0]?.id;
  if (messageId) console.log('[WhatsApp] Sent:', { to, messageId });
  return { ok: true, messageId };
}

export async function sendDocumentToWhatsApp(
  toPhone: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<SendDocumentResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { ok: false, error: 'WhatsApp API not configured (missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)' };
  }
  const to = toPhone.replace(/\D/g, '');
  if (!to) return { ok: false, error: 'Invalid phone number' };

  const textMsg = `Horoscope: ${documentUrl}`;

  try {
    console.log('[WhatsApp] Sending to:', to, '(with country code, no + or spaces)');
    const docBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename: filename || 'horoscope.pdf',
        ...(caption && { caption: caption.slice(0, 1024) }),
      },
    };
    const docRes = await sendWhatsAppMessage(token, phoneNumberId, to, docBody);
    const textBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: textMsg },
    };
    const textRes = await sendWhatsAppMessage(token, phoneNumberId, to, textBody);
    if (docRes.ok || textRes.ok) {
      console.log('[WhatsApp] Delivery accepted by Meta for', to);
      return { ok: true };
    }
    console.error('[WhatsApp] Both document and text failed for', to, docRes.error, textRes.error);
    return { ok: false, error: docRes.error || textRes.error || 'Send failed' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export type SendTextResult = { ok: true; messageId?: string } | { ok: false; error: string };

export async function sendTextToWhatsApp(toPhone: string, text: string): Promise<SendTextResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { ok: false, error: 'WhatsApp API not configured' };
  }
  const to = toPhone.replace(/\D/g, '');
  if (!to) return { ok: false, error: 'Invalid phone number' };
  if (!text || text.length > 4096) return { ok: false, error: 'Text required (max 4096 chars)' };
  try {
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    };
    return await sendWhatsAppMessage(token, phoneNumberId, to, body);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}
