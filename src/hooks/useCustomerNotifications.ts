import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { toast } from 'sonner';
import { getUnreadNotificationCount } from '@/services/api';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080';

export interface WsNotification {
  type: string;
  orderId: string;
  title: string;
  message: string;
  status: string;
  timestamp: string;
}

export function useCustomerNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);
  const clientRef = useRef<Client | null>(null);

  const fetchUnreadCount = useCallback(() => {
    if (!userId) return;
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!userId) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    const client = new Client({
      brokerURL: `${WS_BASE}/ws-notifications`,
      reconnectDelay: 5000,
      onConnect: () => {
        attempts = 0;
        client.subscribe(`/topic/customer/${userId}`, (msg) => {
          try {
            const n: WsNotification = JSON.parse(msg.body);
            toast(n.title, { description: n.message, duration: 6000 });
            setUnreadCount(c => c + 1);
          } catch {
            // ignore malformed frames
          }
        });
      },
      onDisconnect: () => {
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) {
          client.deactivate();
        }
      },
      onWebSocketError: () => {
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) {
          client.deactivate();
        }
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [userId]);

  const resetUnreadCount = useCallback(() => setUnreadCount(0), []);
  const decrementUnread = useCallback(() => setUnreadCount(c => Math.max(0, c - 1)), []);

  return { unreadCount, resetUnreadCount, decrementUnread };
}
