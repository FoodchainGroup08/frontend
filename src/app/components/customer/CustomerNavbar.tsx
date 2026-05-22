import { useRef, useState, useEffect } from "react";
import { Link } from "react-router";
import { ShoppingCart, History, MapPin, User, Sparkles, Bell, ChevronDown, Check, UtensilsCrossed, LogOut, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { NotificationPanel } from "./NotificationPanel";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import { getBranches, type Branch } from "@/services/api";

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [breakpoint]);
  return isMobile;
}

interface CustomerNavbarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  cartItemCount: number;
  userName?: string;
  userId?: string;
  selectedBranch?: string;
  selectedBranchId?: string;
  onChangeBranch: (branch: Branch) => void;
  onLogout: () => void;
  onOpenHelpMeChoose?: () => void;
}

export function CustomerNavbar({
  currentScreen,
  onNavigate,
  cartItemCount,
  userName,
  userId,
  selectedBranch,
  selectedBranchId,
  onChangeBranch,
  onLogout,
  onOpenHelpMeChoose,
}: CustomerNavbarProps) {
  const isMobile = useIsMobile();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const desktopBranchRef = useRef<HTMLDivElement>(null);
  const mobileBranchRef = useRef<HTMLDivElement>(null);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const { unreadCount, resetUnreadCount, decrementUnread } = useCustomerNotifications(userId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const inDesktopBranch = desktopBranchRef.current?.contains(e.target as Node);
      const inMobileBranch = mobileBranchRef.current?.contains(e.target as Node);
      if (!inDesktopBranch && !inMobileBranch) setIsBranchOpen(false);
      if (!isMobile) {
        if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
        if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile]);

  const handleOpenBranchDropdown = async () => {
    setIsBranchOpen(o => !o);
    if (branches.length === 0) {
      setBranchesLoading(true);
      try { setBranches(await getBranches()); } catch { /* keep empty */ }
      setBranchesLoading(false);
    }
  };

  const branchDropdownContent = (
    <div
      className="absolute left-0 top-full mt-2 w-64 rounded-lg shadow-xl py-1 z-50 max-h-72 overflow-y-auto border"
      style={{ backgroundColor: 'var(--warm-white)', borderColor: 'rgba(59,35,20,0.1)' }}
    >
      <p className="px-3 py-1.5 text-xs" style={{ color: 'var(--espresso)', opacity: 0.5 }}>Switch branch</p>
      {branchesLoading ? (
        <div className="px-3 py-3 text-sm text-center" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
          Loading…
        </div>
      ) : branches.map(b => (
        <button
          key={b.id}
          onClick={() => { onChangeBranch(b); setIsBranchOpen(false); }}
          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--espresso)]/5 transition-colors"
          style={{ color: 'var(--espresso)' }}
        >
          {b.id === selectedBranchId
            ? <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
            : <div className="w-3.5" />
          }
          <span style={{ fontWeight: b.id === selectedBranchId ? 600 : 400 }}>{b.name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Top navbar */}
      <nav className="border-b sticky top-0 z-50" style={{ backgroundColor: 'var(--espresso)', borderColor: 'var(--espresso)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: logo + branch */}
            <div className="flex items-center gap-3">
              <Link to="/">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="8" fill="var(--golden-amber)"/>
                  <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--espresso)"/>
                  <circle cx="20" cy="20" r="4" fill="var(--warm-white)"/>
                </svg>
              </Link>

              {/* Desktop brand + branch */}
              <div className="hidden sm:block">
                <h1 className="text-xl" style={{ color: 'var(--warm-white)', fontWeight: 600 }}>FoodChain</h1>
                {selectedBranch && (
                  <div ref={desktopBranchRef} className="relative">
                    <button
                      onClick={handleOpenBranchDropdown}
                      className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--golden-amber)' }}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{selectedBranch}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isBranchOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isBranchOpen && branchDropdownContent}
                  </div>
                )}
              </div>

              {/* Mobile brand + branch */}
              <div className="sm:hidden">
                <h1 className="text-base font-semibold" style={{ color: 'var(--warm-white)' }}>FoodChain</h1>
                {selectedBranch && (
                  <div ref={mobileBranchRef} className="relative">
                    <button
                      onClick={handleOpenBranchDropdown}
                      className="flex items-center gap-1 text-[11px] hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--golden-amber)' }}
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      <span className="max-w-[110px] truncate">{selectedBranch}</span>
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isBranchOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isBranchOpen && branchDropdownContent}
                  </div>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 sm:gap-4">

              {/* Desktop-only nav links */}
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
                onClick={() => onOpenHelpMeChoose ? onOpenHelpMeChoose() : onNavigate('ai-suggestions')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all hidden sm:flex ${
                  currentScreen === 'ai-suggestions' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  color: currentScreen === 'ai-suggestions' ? 'var(--golden-amber)' : 'var(--warm-white)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                Help Me Choose
              </button>

              <button
                onClick={() => onNavigate('order-history')}
                className={`p-2 rounded-md transition-colors hidden sm:block ${
                  currentScreen === 'order-history' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ color: 'var(--warm-white)' }}
              >
                <History className="w-5 h-5" />
              </button>

              {/* Desktop notification bell */}
              <div ref={notifRef} className="relative hidden sm:block">
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
                  isOpen={isNotifOpen && !isMobile}
                  onClose={() => setIsNotifOpen(false)}
                  unreadCount={unreadCount}
                  onResetUnread={resetUnreadCount}
                  onDecrementUnread={decrementUnread}
                />
              </div>

              {/* Cart — always visible */}
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

              {/* Desktop profile — click-based */}
              <div ref={profileRef} className="relative hidden sm:block">
                <button
                  onClick={() => setIsProfileOpen(o => !o)}
                  className="p-2 rounded-md transition-colors opacity-70 hover:opacity-100"
                  style={{ color: 'var(--warm-white)' }}
                >
                  <User className="w-5 h-5" />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1" style={{ backgroundColor: 'var(--warm-white)' }}>
                    <div className="px-4 py-2 border-b border-[var(--espresso)]/10">
                      <p className="text-sm" style={{ color: 'var(--espresso)', fontWeight: 600 }}>{userName || 'Guest'}</p>
                      <p className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.6 }}>Customer</p>
                    </div>
                    <button
                      onClick={() => { onNavigate('profile'); setIsProfileOpen(false); }}
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
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile notification bottom sheet */}
      {isNotifOpen && isMobile && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsNotifOpen(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl flex flex-col"
            style={{ backgroundColor: 'var(--white)', maxHeight: '80vh' }}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(59,35,20,0.15)' }} />
            </div>
            <NotificationPanel
              isOpen={true}
              onClose={() => setIsNotifOpen(false)}
              unreadCount={unreadCount}
              onResetUnread={resetUnreadCount}
              onDecrementUnread={decrementUnread}
              variant="sheet"
            />
          </div>
        </>
      )}

      {/* Mobile profile bottom sheet */}
      {isProfileOpen && isMobile && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsProfileOpen(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl"
            style={{ backgroundColor: 'var(--warm-white)' }}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(59,35,20,0.15)' }} />
            </div>
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid rgba(59,35,20,0.1)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--espresso)' }}>{userName || 'Guest'}</p>
                <p className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.5 }}>Customer</p>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 rounded-full"
                style={{ color: 'var(--espresso)', opacity: 0.5 }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => { onNavigate('profile'); setIsProfileOpen(false); }}
              className="w-full text-left px-5 py-4 text-sm flex items-center gap-3"
              style={{ color: 'var(--espresso)', borderBottom: '1px solid rgba(59,35,20,0.07)' }}
            >
              <User className="w-4 h-4" style={{ opacity: 0.5 }} />
              My Profile
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-5 py-4 text-sm flex items-center gap-3 mb-6"
              style={{ color: '#DC2626' }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </>
      )}

      {/* Mobile bottom navigation bar */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t"
        style={{ backgroundColor: 'var(--espresso)', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-stretch h-14">
          {([
            { id: 'menu', icon: UtensilsCrossed, label: 'Menu', active: currentScreen === 'menu' },
            { id: 'active-orders', icon: History, label: 'Orders', active: currentScreen === 'active-orders' || currentScreen === 'order-tracker' },
          ] as const).map(({ id, icon: Icon, label, active }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity"
              style={{ color: active ? 'var(--golden-amber)' : 'rgba(255,255,255,0.6)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </button>
          ))}
          {/* Help Me Choose */}
          <button
            onClick={() => onOpenHelpMeChoose ? onOpenHelpMeChoose() : onNavigate('ai-suggestions')}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Choose</span>
          </button>

          {/* Alerts */}
          <button
            onClick={() => { setIsProfileOpen(false); setIsNotifOpen(o => !o); }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-opacity"
            style={{ color: isNotifOpen ? 'var(--golden-amber)' : 'rgba(255,255,255,0.6)' }}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ backgroundColor: 'var(--burnt-orange)', color: '#fff' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-wide">Alerts</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => { setIsNotifOpen(false); setIsProfileOpen(o => !o); }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity"
            style={{ color: isProfileOpen ? 'var(--golden-amber)' : 'rgba(255,255,255,0.6)' }}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
}
