import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, CheckCheck, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, type AdminNotification,
} from "@/services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s: string | null | undefined): string {
  if (!s) return '';
  try {
    const d = new Date(s);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  } catch {
    return s;
  }
}

const TYPE_COLORS: Record<string, string> = {
  ORDER_RECEIVED: 'var(--golden-amber)',
  ORDER_STATUS_UPDATE: 'var(--sage-green)',
  ORDER_READY: 'var(--sage-green)',
  REPORT_GENERATED: 'var(--espresso)',
  SYSTEM: '#6B7280',
};

const TYPE_LABELS: Record<string, string> = {
  ORDER_RECEIVED: 'Order',
  ORDER_STATUS_UPDATE: 'Status',
  ORDER_READY: 'Ready',
  REPORT_GENERATED: 'Report',
  SYSTEM: 'System',
};

// ── Notification card ─────────────────────────────────────────────────────────

function NotificationCard({
  notification, onMarkRead, onDelete,
}: {
  notification: AdminNotification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const color = TYPE_COLORS[notification.type] ?? '#6B7280';
  const label = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-lg transition-all"
      style={{
        backgroundColor: notification.isRead ? 'transparent' : `color-mix(in srgb, ${color} 5%, transparent)`,
        border: `1px solid`,
        borderColor: notification.isRead ? 'var(--espresso)' : color,
        opacity: notification.isRead ? 0.75 : 1,
      }}
    >
      {/* Dot indicator */}
      <div className="flex-shrink-0 mt-1">
        {!notification.isRead && (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        )}
        {notification.isRead && (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'transparent' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="text-xs border-0 px-1.5 py-0 h-5" style={{ backgroundColor: color, color: 'white' }}>
              {label}
            </Badge>
            <span className="font-medium text-sm truncate" style={{ color: 'var(--espresso)' }}>
              {notification.title}
            </span>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--espresso)', opacity: 0.4 }}>
            {fmtTime(notification.createdAt)}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
          {notification.message}
        </p>
        {notification.relatedEntityType && (
          <p className="text-xs mt-1" style={{ color: 'var(--espresso)', opacity: 0.4 }}>
            {notification.relatedEntityType}: {notification.relatedEntityId}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!notification.isRead && (
          <button
            onClick={() => onMarkRead(notification.id)}
            title="Mark as read"
            className="p-1.5 rounded transition-colors hover:bg-[var(--espresso)]/10"
            style={{ color: 'var(--espresso)', opacity: 0.5 }}
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          title="Delete"
          className="p-1.5 rounded transition-colors hover:bg-[var(--burnt-orange)]/10"
          style={{ color: 'var(--burnt-orange)', opacity: 0.6 }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const result = await getNotifications(p, 20);
      setNotifications(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(page); }, [page, fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: updated?.isRead ?? true } : n));
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotalElements(prev => Math.max(0, prev - 1));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="h-screen overflow-auto" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-semibold" style={{ color: 'var(--espresso)' }}>Notifications</h1>
                {unreadCount > 0 && (
                  <Badge className="text-xs border-0"
                    style={{ backgroundColor: 'var(--burnt-orange)', color: 'white' }}>
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                {totalElements} total notification{totalElements !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => fetchNotifications(page)}
              className="border-[var(--espresso)]/20 p-2" style={{ color: 'var(--espresso)' }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleMarkAllRead} disabled={markingAll}
                className="gap-2 border-[var(--espresso)]/20"
                style={{ color: 'var(--espresso)' }}>
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
              <Bell className="w-4 h-4" />
              Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <BellOff className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--espresso)', opacity: 0.3 }} />
                <p style={{ color: 'var(--espresso)', opacity: 0.5 }}>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t"
                style={{ borderColor: 'var(--espresso)', opacity: 0.1 }}>
                <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.5 }}>
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="border-[var(--espresso)]/20 p-1.5" style={{ color: 'var(--espresso)' }}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="border-[var(--espresso)]/20 p-1.5" style={{ color: 'var(--espresso)' }}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
