const COUNTDOWN_MS = 30 * 60 * 1000; // 30-minute SLA window

export interface OrderCountdown {
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  display: string;
}

export function computeOrderCountdown(receivedAt: string, now: number): OrderCountdown {
  const elapsed = now - new Date(receivedAt).getTime();
  const remaining = Math.max(0, COUNTDOWN_MS - elapsed);
  const isOverdue = elapsed >= COUNTDOWN_MS;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return {
    minutes,
    seconds,
    isOverdue,
    display: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
  };
}
