import { useEffect, useRef, useState } from 'react';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://54.235.78.18:8080';

export function useManagerOrders(branchId: string, onMessage: (data: unknown) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!branchId) return;
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;
      const ws = new WebSocket(`${WS_BASE}/ws/manager/${branchId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setIsConnected(true);
      };
      ws.onmessage = (e) => {
        try {
          onMessageRef.current(JSON.parse(e.data));
        } catch {
          /* ignore malformed messages */
        }
      };
      ws.onclose = () => {
        if (mountedRef.current) {
          setIsConnected(false);
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };
      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [branchId]);

  return { isConnected };
}
