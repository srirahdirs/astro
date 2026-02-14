/**
 * WhatsApp — wa.me links (no API) + Twilio API send (when configured)
 */

export function getWhatsAppUrl(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const num = digits.length === 10 ? `91${digits}` : digits.startsWith('91') ? digits : digits;
  return `https://wa.me/${num}`;
}

export function getWhatsAppUrlWithMessage(phone: string, message: string): string {
  const url = getWhatsAppUrl(phone);
  if (!url) return '';
  if (!message || !message.trim()) return url;
  return `${url}?text=${encodeURIComponent(message.trim())}`;
}

/** Normalize Indian number to E.164: 9876543210 -> 919876543210 */
function toE164(num: string): string {
  const digits = (num || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `91${digits}` : digits.startsWith('91') ? digits : `91${digits}`;
}

/** Check if Twilio WhatsApp is configured */
export function isTwilioConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
  return !!(sid && token && from);
}

export type TwilioSendResult = { ok: true; sid: string } | { ok: false; error: string };

/** Send WhatsApp message via Twilio. Returns result per recipient. */
export async function sendWhatsAppViaTwilio(
  toNumbers: string[],
  message: string,
  options?: { mediaUrl?: string | string[] }
): Promise<{ results: { number: string; ok: boolean; sid?: string; error?: string }[] }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!sid || !token || !from) {
    return {
      results: toNumbers.map((n) => ({ number: n, ok: false, error: 'Twilio not configured' })),
    };
  }

  const twilio = (await import('twilio')).default;
  const client = twilio(sid, token);

  const results: { number: string; ok: boolean; sid?: string; error?: string }[] = [];

  for (const num of toNumbers) {
    const to = toE164(num);
    if (!to) {
      results.push({ number: num, ok: false, error: 'Invalid number' });
      continue;
    }
    const toWhatsApp = `whatsapp:+${to}`;
    try {
      const payload: Record<string, unknown> = {
        body: message,
        from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
        to: toWhatsApp,
      };
      if (options?.mediaUrl) {
        payload.mediaUrl = Array.isArray(options.mediaUrl) ? options.mediaUrl : [options.mediaUrl];
      }
      const msg = await client.messages.create(payload);
      results.push({ number: to, ok: true, sid: msg.sid });
    } catch (e: unknown) {
      const err = e as { message?: string; code?: number };
      results.push({
        number: to,
        ok: false,
        error: err?.message || String(e),
      });
    }
  }

  return { results };
}
