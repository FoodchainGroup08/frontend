import { Link } from 'react-router';
import {
  Sparkles,
  MapPin,
  Star,
  ChevronRight,
  UtensilsCrossed,
  PackageCheck,
  Clock,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';

const MOCK_SUGGESTIONS = [
  {
    name: 'Jollof Rice Combo',
    price: '₦3,500',
    reason: 'Hearty and savory — matches your appetite perfectly',
  },
  {
    name: 'Grilled Chicken Wrap',
    price: '₦2,800',
    reason: 'Light, protein-rich, great for a healthy mood',
  },
];

const FEATURES = [
  {
    icon: <UtensilsCrossed size={22} />,
    title: 'Full Menu, Always Fresh',
    body: 'Browse every item and price before you commit.',
  },
  {
    icon: <PackageCheck size={22} />,
    title: 'Live Order Tracking',
    body: 'Follow your order from the kitchen to your door.',
  },
  {
    icon: <Clock size={22} />,
    title: 'Quick Checkout',
    body: 'Cart, address, payment — done in under a minute.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
      <style>{`
        @keyframes fc-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        .fc-dot-1 { animation: fc-dot-bounce 1.3s ease-in-out infinite 0ms; }
        .fc-dot-2 { animation: fc-dot-bounce 1.3s ease-in-out infinite 200ms; }
        .fc-dot-3 { animation: fc-dot-bounce 1.3s ease-in-out infinite 400ms; }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-sm"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--warm-white) 88%, transparent)',
          borderColor: 'rgba(59,35,20,0.07)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <span
            className="text-xl font-bold tracking-tight select-none"
            style={{ color: 'var(--espresso)' }}
          >
            FoodChain
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="font-medium" style={{ color: 'var(--espresso)' }}>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="font-semibold text-white"
              style={{ backgroundColor: 'var(--golden-amber)' }}
            >
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div
          className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full pointer-events-none opacity-[0.04]"
          style={{ backgroundColor: 'var(--espresso)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none opacity-[0.06]"
          style={{ backgroundColor: 'var(--golden-amber)' }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--golden-amber) 14%, transparent)',
              color: 'var(--espresso)',
            }}
          >
            <Sparkles size={13} />
            Quick meal discovery
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold leading-tight mb-5"
            style={{ color: 'var(--espresso)' }}
          >
            Not sure what to eat?
            <br />
            <span style={{ color: 'var(--golden-amber)' }}>We'll help you choose.</span>
          </h1>

          <p
            className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ color: 'color-mix(in srgb, var(--espresso) 68%, transparent)' }}
          >
            Answer a few quick questions and we'll suggest the perfect meal from your nearest branch
            — personalised to your taste, no endless scrolling.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="font-semibold text-white min-w-36"
              style={{ backgroundColor: 'var(--espresso)' }}
            >
              <Link to="/register">Help Me Choose</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="font-semibold min-w-36"
              style={{
                borderColor: 'var(--espresso)',
                color: 'var(--espresso)',
              }}
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ color: 'var(--espresso)' }}
            >
              From craving to cart in three steps
            </h2>
            <p
              className="text-base sm:text-lg"
              style={{ color: 'color-mix(in srgb, var(--espresso) 60%, transparent)' }}
            >
              Answer a few quick questions. We handle the rest.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-2">
            {/* Step 1 — We ask */}
            <div
              className="flex-1 rounded-2xl border p-6"
              style={{
                backgroundColor: '#fff',
                borderColor: 'color-mix(in srgb, var(--espresso) 11%, transparent)',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: 'var(--golden-amber)' }}
                >
                  1
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--espresso)' }}>
                  We ask
                </span>
              </div>

              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--espresso)' }}>
                How hungry are you?
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {(['Light snack', 'Moderate meal', 'Very hungry', 'Family-sized'] as const).map(
                  (opt, i) => (
                    <span
                      key={opt}
                      className="text-xs px-2 py-1.5 rounded-lg border text-center font-medium"
                      style={
                        i === 1
                          ? {
                              backgroundColor: 'var(--golden-amber)',
                              color: '#fff',
                              borderColor: 'var(--golden-amber)',
                            }
                          : {
                              borderColor: 'color-mix(in srgb, var(--espresso) 18%, transparent)',
                              color: 'var(--espresso)',
                            }
                      }
                    >
                      {opt}
                    </span>
                  ),
                )}
              </div>

              <p className="text-sm font-semibold mb-2.5" style={{ color: 'var(--espresso)' }}>
                What are you in the mood for?
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(['Spicy', 'Healthy', 'Comfort food', 'Savory', 'Sweet'] as const).map((mood, i) => (
                  <span
                    key={mood}
                    className="text-xs px-2.5 py-1 rounded-full border font-medium"
                    style={
                      i === 1
                        ? {
                            backgroundColor: 'color-mix(in srgb, var(--golden-amber) 14%, transparent)',
                            color: 'var(--espresso)',
                            borderColor: 'var(--golden-amber)',
                          }
                        : {
                            borderColor: 'color-mix(in srgb, var(--espresso) 16%, transparent)',
                            color: 'var(--espresso)',
                          }
                    }
                  >
                    {mood}
                  </span>
                ))}
              </div>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center px-2 shrink-0">
              <ChevronRight
                size={22}
                style={{ color: 'color-mix(in srgb, var(--espresso) 25%, transparent)' }}
              />
            </div>

            {/* Step 2 — We match */}
            <div
              className="flex-1 rounded-2xl border p-6 flex flex-col"
              style={{
                backgroundColor: '#fff',
                borderColor: 'color-mix(in srgb, var(--espresso) 11%, transparent)',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: 'var(--golden-amber)' }}
                >
                  2
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--espresso)' }}>
                  We match
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--golden-amber) 11%, transparent)',
                  }}
                >
                  <Sparkles size={22} style={{ color: 'var(--golden-amber)' }} />
                </div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--espresso)' }}>
                  Finding the perfect meals for you
                </p>
                <div className="flex items-center gap-1.5 mb-4">
                  <span
                    className="w-2 h-2 rounded-full fc-dot-1"
                    style={{ backgroundColor: 'var(--golden-amber)' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full fc-dot-2"
                    style={{ backgroundColor: 'var(--golden-amber)' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full fc-dot-3"
                    style={{ backgroundColor: 'var(--golden-amber)' }}
                  />
                </div>
                <p
                  className="text-xs"
                  style={{ color: 'color-mix(in srgb, var(--espresso) 48%, transparent)' }}
                >
                  Checking your branch's menu against your preferences
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center px-2 shrink-0">
              <ChevronRight
                size={22}
                style={{ color: 'color-mix(in srgb, var(--espresso) 25%, transparent)' }}
              />
            </div>

            {/* Step 3 — We suggest */}
            <div
              className="flex-1 rounded-2xl border p-6"
              style={{
                backgroundColor: '#fff',
                borderColor: 'color-mix(in srgb, var(--espresso) 11%, transparent)',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: 'var(--golden-amber)' }}
                >
                  3
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--espresso)' }}>
                  We suggest
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {MOCK_SUGGESTIONS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--espresso) 9%, transparent)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ color: 'var(--espresso)' }}
                        >
                          {item.name}
                        </span>
                        <span
                          className="text-sm font-bold shrink-0"
                          style={{ color: 'var(--golden-amber)' }}
                        >
                          {item.price}
                        </span>
                      </div>
                      <div className="flex items-start gap-1 mt-0.5">
                        <Sparkles
                          size={10}
                          className="shrink-0 mt-0.5"
                          style={{ color: 'var(--golden-amber)' }}
                        />
                        <span
                          className="text-xs leading-tight"
                          style={{
                            color: 'color-mix(in srgb, var(--espresso) 52%, transparent)',
                          }}
                        >
                          {item.reason}
                        </span>
                      </div>
                    </div>
                    <button
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: 'var(--espresso)' }}
                      tabIndex={-1}
                    >
                      <ShoppingCart size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Branch Callout ─────────────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-24"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--espresso) 3.5%, var(--warm-white))',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Copy */}
            <div>
              <h2
                className="text-3xl sm:text-4xl font-bold mb-4 leading-snug"
                style={{ color: 'var(--espresso)' }}
              >
                We find your nearest branch — or order for a friend
              </h2>
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: 'color-mix(in srgb, var(--espresso) 68%, transparent)' }}
              >
                FoodChain detects your location and defaults to the closest branch. Ordering for
                someone in another area? Switch branches in one tap.
              </p>
            </div>

            {/* Mock branch card */}
            <div
              className="rounded-2xl border p-5 max-w-sm mx-auto md:mx-0 md:ml-auto w-full"
              style={{
                backgroundColor: '#fff',
                borderColor: 'color-mix(in srgb, var(--espresso) 10%, transparent)',
                boxShadow: '0 8px 40px color-mix(in srgb, var(--golden-amber) 18%, transparent)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base" style={{ color: 'var(--espresso)' }}>
                    Victoria Island
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star
                      size={12}
                      fill="var(--golden-amber)"
                      stroke="var(--golden-amber)"
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--espresso)' }}>
                      4.8
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--golden-amber) 14%, transparent)',
                      color: 'var(--espresso)',
                    }}
                  >
                    Fastest delivery
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'color-mix(in srgb, var(--espresso) 48%, transparent)' }}
                  >
                    1.2 km away
                  </span>
                </div>
              </div>

              <div
                className="flex items-center gap-1.5 text-xs mb-1.5"
                style={{ color: 'color-mix(in srgb, var(--espresso) 58%, transparent)' }}
              >
                <MapPin size={11} />
                14 Adeola Odeku St, Victoria Island
              </div>

              <div className="flex items-center gap-1.5 text-xs mb-5" style={{ color: 'var(--sage-green)' }}>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--sage-green)' }}
                />
                Open now · Closes 10:00 PM
              </div>

              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--espresso)' }}
                tabIndex={-1}
              >
                Order from here
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Supporting Features ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
            style={{ color: 'var(--espresso)' }}
          >
            Everything else you need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="rounded-2xl border p-6"
                style={{
                  backgroundColor: '#fff',
                  borderColor: 'color-mix(in srgb, var(--espresso) 10%, transparent)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--golden-amber) 11%, transparent)',
                    color: 'var(--golden-amber)',
                  }}
                >
                  {feat.icon}
                </div>
                <h3
                  className="font-semibold text-base mb-1"
                  style={{ color: 'var(--espresso)' }}
                >
                  {feat.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'color-mix(in srgb, var(--espresso) 58%, transparent)' }}
                >
                  {feat.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: 'var(--espresso)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: 'var(--warm-white)' }}
          >
            Ready to eat well?
          </h2>
          <p
            className="text-base sm:text-lg mb-8"
            style={{ color: 'color-mix(in srgb, var(--warm-white) 70%, transparent)' }}
          >
            Join FoodChain and discover your next favourite meal in under a minute.
          </p>
          <Button
            size="lg"
            asChild
            className="font-semibold text-white"
            style={{ backgroundColor: 'var(--golden-amber)' }}
          >
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className="py-8 border-t"
        style={{
          backgroundColor: 'var(--espresso)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--warm-white)' }}
          >
            FoodChain &copy; 2026
          </span>
          <div className="flex items-center gap-5">
            <Link
              to="/login"
              className="text-sm transition-opacity hover:opacity-100"
              style={{ color: 'color-mix(in srgb, var(--warm-white) 60%, transparent)' }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm transition-opacity hover:opacity-100"
              style={{ color: 'color-mix(in srgb, var(--warm-white) 60%, transparent)' }}
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
