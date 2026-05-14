import type { CSSProperties } from "react";
import type { OrderStatus } from "@/services/api";

type StatusDisplayConfig = {
  label: string;
  style: CSSProperties;
};

const completedStyle: CSSProperties = {
  backgroundColor: 'var(--sage-green)',
  color: 'var(--white)',
};

const inProgressStyle: CSSProperties = {
  backgroundColor: 'var(--golden-amber)',
  color: 'var(--charcoal)',
};

const cancelledStyle: CSSProperties = {
  backgroundColor: 'var(--burnt-orange)',
  color: 'var(--white)',
};

const neutralStyle: CSSProperties = {
  backgroundColor: 'var(--espresso)',
  color: 'var(--white)',
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusDisplayConfig> = {
  RECEIVED: { label: 'Received', style: neutralStyle },
  CONFIRMED: { label: 'Confirmed', style: neutralStyle },
  PREPARING: { label: 'Preparing', style: inProgressStyle },
  READY: { label: 'Ready', style: inProgressStyle },
  PICKED_UP: { label: 'Picked Up', style: completedStyle },
  SERVED: { label: 'Served', style: completedStyle },
  COMPLETED: { label: 'Completed', style: completedStyle },
  CANCELLED: { label: 'Cancelled', style: cancelledStyle },
};

export function formatOrderStatus(status: string): string {
  const label = status
    .toLowerCase()
    .split(/[_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return label || 'Unknown';
}

export function getOrderStatusDisplay(status: string): StatusDisplayConfig {
  return ORDER_STATUS_CONFIG[status as OrderStatus] ?? {
    label: formatOrderStatus(status),
    style: neutralStyle,
  };
}
