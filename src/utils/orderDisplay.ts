export function formatOrderReference(orderId?: string, length = 8): string {
  if (!orderId) return '#—';

  const compactId = orderId.replace(/-/g, '');
  const shortId = compactId.slice(-length).toUpperCase();

  return `#${shortId || '—'}`;
}
