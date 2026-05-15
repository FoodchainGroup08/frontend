import { Link } from "react-router";
import { BarChart3, Building2, UtensilsCrossed, User, FileText } from "lucide-react";

interface AdminSidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  userName: string;
  onLogout: () => void;
}

export function AdminSidebar({
  currentScreen,
  onNavigate,
  userName,
  onLogout
}: AdminSidebarProps) {
  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'branches', label: 'Branches', icon: Building2 },
    { id: 'menu-catalogue', label: 'Menu Catalogue', icon: UtensilsCrossed },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="w-64 h-screen flex flex-col border-r" style={{ backgroundColor: 'var(--espresso)', borderColor: 'var(--espresso)' }}>
      <div className="p-6 border-b" style={{ borderColor: 'rgba(250, 247, 242, 0.1)' }}>
        <Link to="/" className="flex items-center gap-3 mb-2">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="var(--golden-amber)"/>
            <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--espresso)"/>
            <circle cx="20" cy="20" r="4" fill="var(--warm-white)"/>
          </svg>
          <div>
            <h1 className="text-lg" style={{ color: 'var(--warm-white)', fontWeight: 600 }}>FoodChain</h1>
            <p className="text-xs" style={{ color: 'var(--golden-amber)' }}>Head Office</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--golden-amber)' : 'transparent',
                color: isActive ? 'var(--charcoal)' : 'var(--warm-white)'
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
              {item.badge != null && (
                <span className="min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 text-xs font-semibold"
                  style={{ backgroundColor: 'var(--burnt-orange)', color: 'white' }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'rgba(250, 247, 242, 0.1)' }}>
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--golden-amber)' }}>
            <User className="w-4 h-4" style={{ color: 'var(--charcoal)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: 'var(--warm-white)', fontWeight: 600 }}>{userName}</p>
            <p className="text-xs" style={{ color: 'var(--warm-white)', opacity: 0.6 }}>Admin</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 rounded-md text-sm transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
