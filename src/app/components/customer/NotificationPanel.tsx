import { useEffect, useState } from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification,
  type AdminNotification,
} from '@/services/api';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onResetUnread: () => void;
  onDecrementUnread: () => void;
}

const STATUS_DOT: Record<string, string> = {
  PREPARING: 'var(--foodchain-golden-amber)',
  READY:     'var(--foodchain-sage-green)',
  CANCELLED: '#9CA3AF',
};

function dotColor(status: string) {
  return STATUS_DOT[status] ?? 'var(--foodchain-espresso)';
}

export function NotificationPanel({
  isOpen,
  onClose,
  unreadCount,
  onResetUnread,
  onDecrementUnread,
}: NotificationPanelProps) {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getNotifications(0, 20)
      .then(data => {
        setItems(data.content);
        if (unreadCount > 0) {
          markAllNotificationsRead().then(onResetUnread).catch(() => {});
        }
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const handleDelete = (id: number) => {
    const notif = items.find(n => n.id === id);
    deleteNotification(id)
      .then(() => {
        setItems(prev => prev.filter(n => n.id !== id));
        if (notif && !notif.isRead) onDecrementUnread();
      })
      .catch(() => toast.error('Failed to delete'));
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-0 top-full mt-2 w-96 rounded-lg shadow-xl z-50 flex flex-col"
      style={{
        backgroundColor: 'var(--foodchain-white)',
        border: '1px solid rgba(59,35,20,0.15)',
        maxHeight: '480px',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(59,35,20,0.1)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--foodchain-espresso)' }}>
          Notifications
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--foodchain-espresso)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Bell className="w-8 h-8" style={{ color: 'var(--foodchain-espresso)', opacity: 0.2 }} />
            <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.45 }}>
              No notifications yet
            </p>
          </div>
        ) : (
          items.map(n => (
            <div
              key={n.id}
              className="px-4 py-3 flex items-start gap-3 group"
              style={{
                borderBottom: '1px solid rgba(59,35,20,0.07)',
                backgroundColor: n.isRead ? 'transparent' : 'rgba(240,165,0,0.07)',
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: dotColor(n.status), opacity: n.isRead ? 0.3 : 1 }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm leading-snug mb-0.5"
                  style={{
                    color: 'var(--foodchain-espresso)',
                    fontWeight: n.isRead ? 400 : 600,
                  }}
                >
                  {n.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                  {n.message}
                </p>
                {n.sentAt && (
                  <p className="text-xs mt-1" style={{ color: 'var(--foodchain-espresso)', opacity: 0.35 }}>
                    {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(n.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                className="p-1 rounded flex-shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                style={{ color: 'var(--foodchain-espresso)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
