import { useRef, useState, useEffect } from "react";
import { Link } from "react-router";
import { ShoppingCart, History, MapPin, User, Sparkles, Bell } from "lucide-react";
import { Badge } from "../ui/badge";
import { NotificationPanel } from "./NotificationPanel";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";

interface CustomerNavbarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  cartItemCount: number;
  userName?: string;
  userId?: string;
  selectedBranch?: string;
  onLogout: () => void;
}

export function CustomerNavbar({
  currentScreen,
  onNavigate,
  cartItemCount,
  userName,
  userId,
  selectedBranch,
  onLogout,
}: CustomerNavbarProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { unreadCount, resetUnreadCount, decrementUnread } = useCustomerNotifications(userId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="border-b sticky top-0 z-50" style={{ backgroundColor: 'var(--espresso)', borderColor: 'var(--espresso)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="var(--golden-amber)"/>
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--espresso)"/>
              <circle cx="20" cy="20" r="4" fill="var(--warm-white)"/>
            </svg>
            <div className="hidden sm:block">
              <h1 className="text-xl" style={{ color: 'var(--warm-white)', fontWeight: 600 }}>FoodChain</h1>
              {selectedBranch && (
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--golden-amber)' }}>
                  <MapPin className="w-3 h-3" />
                  <span>{selectedBranch}</span>
                </div>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onNavigate('menu')}
              className={`px-3 py-2 rounded-md text-sm transition-colors hidden sm:block ${
                currentScreen === 'menu' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ color: 'var(--warm-white)' }}
            >
              Menu
            </button>

            <button
              onClick={() => onNavigate('active-orders')}
              className={`px-3 py-2 rounded-md text-sm transition-colors hidden sm:block ${
                currentScreen === 'active-orders' || currentScreen === 'order-tracker' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ color: 'var(--warm-white)' }}
            >
              Track Orders
            </button>

            <button
              onClick={() => onNavigate('ai-suggestions')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all hidden sm:flex ${
                currentScreen === 'ai-suggestions' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                color: currentScreen === 'ai-suggestions'
                  ? 'var(--golden-amber)'
                  : 'var(--warm-white)',
              }}
            >
              <Sparkles className="w-4 h-4" />
              AI Suggest
            </button>

            <button
              onClick={() => onNavigate('order-history')}
              className={`p-2 rounded-md transition-colors ${
                currentScreen === 'order-history' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ color: 'var(--warm-white)' }}
            >
              <History className="w-5 h-5" />
            </button>

            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setIsNotifOpen(o => !o)}
                className="relative p-2 rounded-md transition-colors opacity-70 hover:opacity-100"
                style={{ color: 'var(--warm-white)' }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs border-0"
                    style={{ backgroundColor: 'var(--burnt-orange)', color: 'var(--white)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </button>
              <NotificationPanel
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                unreadCount={unreadCount}
                onResetUnread={resetUnreadCount}
                onDecrementUnread={decrementUnread}
              />
            </div>

            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 rounded-md transition-colors opacity-70 hover:opacity-100"
              style={{ color: 'var(--warm-white)' }}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs border-0"
                  style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
                >
                  {cartItemCount}
                </Badge>
              )}
            </button>

            <div className="relative group">
              <button
                className="p-2 rounded-md transition-colors opacity-70 hover:opacity-100"
                style={{ color: 'var(--warm-white)' }}
              >
                <User className="w-5 h-5" />
              </button>
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all" style={{ backgroundColor: 'var(--warm-white)' }}>
                <div className="px-4 py-2 border-b border-[var(--espresso)]/10">
                  <p className="text-sm" style={{ color: 'var(--espresso)', fontWeight: 600 }}>{userName || 'Guest'}</p>
                  <p className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.6 }}>Customer</p>
                </div>
                <button
                  onClick={() => onNavigate('profile')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--espresso)]/5 transition-colors"
                  style={{ color: 'var(--espresso)' }}
                >
                  My Profile
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--espresso)]/5 transition-colors"
                  style={{ color: 'var(--espresso)' }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
