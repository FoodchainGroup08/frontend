import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InitializePaymentRequest {
  orderId: string;
  email: string;
  amount: number;
}

export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  orderId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  paymentStatus: 'PAID' | 'FAILED' | 'INITIATED' | 'PENDING';
  orderStatus: string;
  reference: string;
  orderId: string;
  message: string;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const initializePaystackPayment = (
  req: InitializePaymentRequest
): Promise<InitializePaymentResponse> =>
  apiClient
    .post<InitializePaymentResponse>('/payments/paystack/initialize', req)
    .then(r => r.data);

export const verifyPaystackPayment = (
  reference: string
): Promise<VerifyPaymentResponse> =>
  apiClient
    .get<VerifyPaymentResponse>(`/payments/paystack/verify/${reference}`)
    .then(r => r.data);

// ─── Session storage helpers ──────────────────────────────────────────────────

const PENDING_ORDER_KEY = 'foodchain_pending_order_id';

export const savePendingOrderId = (orderId: string) =>
  sessionStorage.setItem(PENDING_ORDER_KEY, orderId);

export const getPendingOrderId = () =>
  sessionStorage.getItem(PENDING_ORDER_KEY);

export const clearPendingOrderId = () =>
  sessionStorage.removeItem(PENDING_ORDER_KEY);

// ─── React Query hooks ────────────────────────────────────────────────────────

export function useInitializePaystackPayment() {
  return useMutation<InitializePaymentResponse, Error, InitializePaymentRequest>({
    mutationFn: initializePaystackPayment,
  });
}

export function useVerifyPaystackPayment(reference: string, enabled: boolean) {
  return useQuery<VerifyPaymentResponse, Error>({
    queryKey: ['payment', 'verify', reference],
    queryFn: () => verifyPaystackPayment(reference),
    enabled: enabled && !!reference,
    retry: 2,
    staleTime: Infinity,
  });
}
