const COUNTDOWN_MS = 30 * 60 * 1000; // 30-minute SLA window

export interface OrderCountdown {
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  display: string;
}

// Java LocalDateTime serializes without a timezone suffix — append Z to treat as UTC
export function toUtcDate(dateString: string): Date {
  const hasZone = dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString);
  return new Date(hasZone ? dateString : dateString + 'Z');
}

export function computeOrderCountdown(receivedAt: string, now: number): OrderCountdown {
  const elapsed = now - toUtcDate(receivedAt).getTime();
  const isOverdue = elapsed >= COUNTDOWN_MS;
  const displayMs = Math.min(elapsed, COUNTDOWN_MS);
  const minutes = Math.floor(displayMs / 60000);
  const seconds = Math.floor((displayMs % 60000) / 1000);
  return {
    minutes,
    seconds,
    isOverdue,
    display: isOverdue ? 'Exceeded' : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
  };
}
