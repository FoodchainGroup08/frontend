import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Separator } from '../ui/separator';
import { CheckCircle2, Eye, EyeOff, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { LocationPicker } from './LocationPicker';
import { saveDeliveryLocation } from '@/services/locationService';
import { getGoogleOAuthStartUrl } from '@/services/api';

interface RegisterProps {
  onNavigateToLogin: () => void;
  onVerificationRequired: (email: string) => void;
}

const FoodChainLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="var(--foodchain-espresso)" />
    <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--foodchain-golden-amber)" />
    <circle cx="20" cy="20" r="4" fill="var(--foodchain-warm-white)" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4" />
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853" />
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05" />
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335" />
  </svg>
);

export function Register({ onNavigateToLogin, onVerificationRequired }: RegisterProps) {
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Step 2
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!name.trim()) { setError('Full name is required'); return; }
    if (!trimmedEmail) { setError('Email is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter'); return; }
    if (!/\d/.test(password)) { setError('Password must contain at least one digit'); return; }
    if (!/[@#$!%*?&\-_+=]/.test(password)) { setError('Password must contain at least one special character (@#$!%*?&-_+=)'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      await register(name.trim(), trimmedEmail, password);
      localStorage.setItem('foodchain_pending_email', trimmedEmail);
      setStep(2);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Please try again';
      toast.error('Registration failed', { description: msg });
      setError(`Registration failed. ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) { setError('Phone number is required'); return; }
    if (!deliveryLocation.trim()) { setError('Please enter your delivery location'); return; }

    saveDeliveryLocation(deliveryLocation);
    localStorage.setItem('foodchain_phone_number', phoneNumber.trim());
    onVerificationRequired(email.trim());
  };

  const handleGoogleSignUp = () => {
    window.location.href = getGoogleOAuthStartUrl();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12"
      style={{ backgroundColor: 'var(--foodchain-warm-white)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <FoodChainLogo />
            <h1 className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
              FoodChain
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
            Multi-branch Restaurant Management
          </p>
        </div>

        <Card className="border-0 shadow-xl" style={{ backgroundColor: 'var(--foodchain-white)' }}>

          {/* ── Step 1: Account details ───────────────────────────────────────── */}
          {step === 1 && (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl" style={{ color: 'var(--foodchain-espresso)' }}>
                  Create an account
                </CardTitle>
                <CardDescription style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                  Step 1 of 2 · Account details
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleStep1}>
                <CardContent className="space-y-4">
                  {error && (
                    <div
                      className="p-3 rounded-md text-sm"
                      style={{ backgroundColor: 'var(--foodchain-burnt-orange)', color: 'var(--foodchain-white)' }}
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" style={{ color: 'var(--foodchain-espresso)' }}>Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="border-[var(--foodchain-espresso)]/20"
                      style={{ backgroundColor: 'var(--foodchain-white)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" style={{ color: 'var(--foodchain-espresso)' }}>Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value.trim())}
                      required
                      className="border-[var(--foodchain-espresso)]/20"
                      style={{ backgroundColor: 'var(--foodchain-white)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" style={{ color: 'var(--foodchain-espresso)' }}>Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="border-[var(--foodchain-espresso)]/20 pr-10"
                        style={{ backgroundColor: 'var(--foodchain-white)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--foodchain-espresso)', opacity: 0.5 }}
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--foodchain-espresso)', opacity: 0.55 }}>
                      Min. 8 chars · uppercase · lowercase · digit · special (@#$!%*?&amp;-_+=)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" style={{ color: 'var(--foodchain-espresso)' }}>
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="border-[var(--foodchain-espresso)]/20"
                      style={{ backgroundColor: 'var(--foodchain-white)' }}
                    />
                    {passwordsMatch && (
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--foodchain-sage-green)' }}>
                        <CheckCircle2 className="w-3 h-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                  <Button
                    type="submit"
                    className="w-full transition-all hover:opacity-90 hover:shadow-lg"
                    disabled={isLoading}
                    style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
                  >
                    {isLoading ? 'Creating account…' : 'Continue'}
                  </Button>

                  <div className="relative w-full">
                    <Separator />
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs"
                      style={{ backgroundColor: 'var(--foodchain-white)', color: 'var(--foodchain-espresso)', opacity: 0.6 }}
                    >
                      OR
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGoogleSignUp}
                    variant="outline"
                    className="w-full border-[var(--foodchain-espresso)]/20 gap-2"
                    style={{ color: 'var(--foodchain-espresso)' }}
                  >
                    <GoogleIcon />
                    Continue with Google
                  </Button>

                  <div className="text-center text-sm">
                    <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Already have an account? </span>
                    <button
                      type="button"
                      onClick={onNavigateToLogin}
                      className="underline"
                      style={{ color: 'var(--foodchain-golden-amber)' }}
                    >
                      Sign in
                    </button>
                  </div>
                </CardFooter>
              </form>
            </>
          )}

          {/* ── Step 2: Delivery details ──────────────────────────────────────── */}
          {step === 2 && (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl" style={{ color: 'var(--foodchain-espresso)' }}>
                  Set up delivery
                </CardTitle>
                <CardDescription style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                  Step 2 of 2 · Delivery details
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleStep2}>
                <CardContent className="space-y-4">
                  {error && (
                    <div
                      className="p-3 rounded-md text-sm"
                      style={{ backgroundColor: 'var(--foodchain-burnt-orange)', color: 'var(--foodchain-white)' }}
                    >
                      {error}
                    </div>
                  )}

                  <div
                    className="p-3 rounded-lg flex items-start gap-3"
                    style={{ backgroundColor: 'rgba(240, 165, 0, 0.08)' }}
                  >
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--foodchain-golden-amber)' }} />
                    <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.85 }}>
                      Your delivery address will be pre-filled on every order. You can always change it at checkout.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" style={{ color: 'var(--foodchain-espresso)' }}>Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="080 1234 5678"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      required
                      className="border-[var(--foodchain-espresso)]/20"
                      style={{ backgroundColor: 'var(--foodchain-white)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label style={{ color: 'var(--foodchain-espresso)' }}>Delivery Location</Label>
                    <LocationPicker
                      value={deliveryLocation}
                      onChange={setDeliveryLocation}
                      placeholder="Search for your area, e.g. Lekki, VI…"
                    />
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
                  >
                    Finish
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

        </Card>
      </div>
    </div>
  );
}
