import { ShoppingCart, History, MapPin, User } from "lucide-react";
import { Badge } from "../ui/badge";

interface CustomerNavbarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  cartItemCount: number;
  userName?: string;
  selectedBranch?: string;
  onLogout: () => void;
}

export function CustomerNavbar({
  currentScreen,
  onNavigate,
  cartItemCount,
  userName,
  selectedBranch,
  onLogout
}: CustomerNavbarProps) {
  return (
    <nav className="border-b sticky top-0 z-50" style={{ backgroundColor: '#3B2314', borderColor: '#3B2314' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('branch-selector')}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#F0A500"/>
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="#3B2314"/>
              <circle cx="20" cy="20" r="4" fill="#FAF7F2"/>
            </svg>
            <div className="hidden sm:block">
              <h1 className="text-xl" style={{ color: '#FAF7F2', fontWeight: 600 }}>FoodChain</h1>
              {selectedBranch && (
                <div className="flex items-center gap-1 text-xs" style={{ color: '#F0A500' }}>
                  <MapPin className="w-3 h-3" />
                  <span>{selectedBranch}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onNavigate('menu')}
              className={`px-3 py-2 rounded-md text-sm transition-colors hidden sm:block ${
                currentScreen === 'menu' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ color: '#FAF7F2' }}
            >
              Menu
            </button>

            <button
              onClick={() => onNavigate('order-tracker')}
              className={`px-3 py-2 rounded-md text-sm transition-colors hidden sm:block ${
                currentScreen === 'order-tracker' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ color: '#FAF7F2' }}
            >
              Track Order
            </button>

            <button
              onClick={() => onNavigate('order-history')}
              className={`p-2 rounded-md transition-colors ${
                currentScreen === 'order-history' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ color: '#FAF7F2' }}
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 rounded-md transition-colors opacity-70 hover:opacity-100"
              style={{ color: '#FAF7F2' }}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs border-0"
                  style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}
                >
                  {cartItemCount}
                </Badge>
              )}
            </button>

            <div className="relative group">
              <button
                className="p-2 rounded-md transition-colors opacity-70 hover:opacity-100"
                style={{ color: '#FAF7F2' }}
              >
                <User className="w-5 h-5" />
              </button>
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all" style={{ backgroundColor: '#FAF7F2' }}>
                <div className="px-4 py-2 border-b border-[#3B2314]/10">
                  <p className="text-sm" style={{ color: '#3B2314', fontWeight: 600 }}>{userName || 'Guest'}</p>
                  <p className="text-xs" style={{ color: '#3B2314', opacity: 0.6 }}>Customer</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#3B2314]/5 transition-colors"
                  style={{ color: '#3B2314' }}
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
