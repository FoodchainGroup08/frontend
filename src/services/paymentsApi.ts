import { useState, useEffect, useRef } from 'react';
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

// ─── React hooks ─────────────────────────────────────────────────────────────

export interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useInitializePaystackPayment() {
  const [state, setState] = useState<MutationState<InitializePaymentResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = async (req: InitializePaymentRequest): Promise<InitializePaymentResponse> => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await initializePaystackPayment(req);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Initialization failed';
      setState({ data: null, loading: false, error: msg });
      throw err;
    }
  };

  return { ...state, mutate };
}

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useVerifyPaystackPayment(reference: string, enabled: boolean) {
  const [state, setState] = useState<QueryState<VerifyPaymentResponse>>({
    data: null,
    loading: false,
    error: null,
  });
  const calledRef = useRef(false);

  useEffect(() => {
    if (!enabled || !reference || calledRef.current) return;
    calledRef.current = true;

    setState({ data: null, loading: true, error: null });
    verifyPaystackPayment(reference)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Verification failed';
        setState({ data: null, loading: false, error: msg });
      });
  }, [reference, enabled]);

  return state;
}
