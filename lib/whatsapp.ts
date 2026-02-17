/**
 * WhatsApp — wa.me links (manual send only)
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
