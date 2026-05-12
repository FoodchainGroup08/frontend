import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { postGoogleAuth, postResendVerification } from "@/services/api";

interface LoginProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onVerificationRequired?: (email: string) => void;
}

export function Login({ onNavigateToRegister, onNavigateToForgotPassword, onVerificationRequired }: LoginProps) {
  const { login, completeOAuthLogin } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnverifiedEmail(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;
      const serverMsg: string = err?.response?.data?.message ?? err?.message ?? '';
      if (status === 403 && serverMsg.toLowerCase().includes('verify')) {
        setUnverifiedEmail(email);
        if (onVerificationRequired) {
          onVerificationRequired(email);
        }
      } else {
        const errorMsg = serverMsg || "Invalid email or password";
        toast.error("Login failed", { description: errorMsg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      await postResendVerification(unverifiedEmail);
      toast.success('Verification email sent', { description: `Check ${unverifiedEmail} for a new link.` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not resend verification email';
      toast.error('Failed to resend', { description: msg });
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const init = () => {
      window.google?.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            const result = await postGoogleAuth(response.credential);
            await completeOAuthLogin(result.accessToken, result.refreshToken);
          } catch (err: any) {
            toast.error('Google sign-in failed', {
              description: err?.response?.data?.message ?? err?.message ?? 'Please try again.',
            });
          }
        },
      });
      window.google?.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleBtnRef.current?.offsetWidth,
      });
    };

    if (window.google?.accounts) {
      init();
    } else {
      const script = document.querySelector<HTMLScriptElement>('script[src*="gsi/client"]');
      script?.addEventListener('load', init, { once: true });
      return () => script?.removeEventListener('load', init);
    }
  }, [completeOAuthLogin]);

  const useDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.success("Demo credentials loaded", { description: "Click 'Sign in' to continue" });
  };

  const demoAccounts = [
    { role: "Customer", email: "user@demo.com", password: "Demo@1234" },
    { role: "Kitchen Staff", email: "kitchen@demo.com", password: "Demo@1234" },
    { role: "Branch Manager", email: "manager@demo.com", password: "Demo@1234" },
    { role: "Admin", email: "admin@demo.com", password: "Demo@1234" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="var(--foodchain-espresso)"/>
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--foodchain-golden-amber)"/>
              <circle cx="20" cy="20" r="4" fill="var(--foodchain-warm-white)"/>
            </svg>
            <h1 className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>FoodChain</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
            Multi-branch Restaurant Management
          </p>
        </div>

        <Card className="border-0 shadow-xl" style={{ backgroundColor: 'var(--foodchain-white)' }}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl" style={{ color: 'var(--foodchain-espresso)' }}>Welcome back</CardTitle>
            <CardDescription style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {unverifiedEmail && (
                <div className="p-3 rounded-md text-sm space-y-2" style={{ backgroundColor: 'rgba(240, 165, 0, 0.12)', border: '1px solid rgba(240, 165, 0, 0.4)' }}>
                  <p style={{ color: 'var(--foodchain-espresso)' }}>
                    Please verify your email before signing in. Check your inbox for <span style={{ fontWeight: 600 }}>{unverifiedEmail}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="underline text-xs"
                    style={{ color: 'var(--foodchain-golden-amber)' }}
                  >
                    {isResending ? 'Sending…' : 'Resend verification email'}
                  </button>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: 'var(--foodchain-espresso)' }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[var(--foodchain-espresso)]/20"
                  style={{ backgroundColor: 'var(--foodchain-white)' }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" style={{ color: 'var(--foodchain-espresso)' }}>Password</Label>
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-sm hover:underline"
                    style={{ color: 'var(--foodchain-golden-amber)' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-[var(--foodchain-espresso)]/20 pr-10"
                    style={{ backgroundColor: 'var(--foodchain-white)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--foodchain-espresso)', opacity: 0.5 }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full mt-5 transition-all hover:opacity-90 hover:shadow-lg"
                disabled={isLoading}
                style={{
                  backgroundColor: 'var(--foodchain-golden-amber)',
                  color: 'var(--foodchain-charcoal)'
                }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="relative w-full">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs" style={{ backgroundColor: 'var(--foodchain-white)', color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                  OR
                </span>
              </div>

              <div ref={googleBtnRef} className="w-full flex justify-center" />

              <div className="text-center text-sm">
                <span style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>Don't have an account? </span>
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="underline"
                  style={{ color: 'var(--foodchain-golden-amber)' }}
                >
                  Create account
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowDemoCredentials(!showDemoCredentials)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors"
            style={{
              backgroundColor: 'var(--foodchain-warm-white)',
              borderColor: 'var(--foodchain-espresso)',
              borderWidth: '1px',
              borderStyle: 'solid',
              opacity: 0.9
            }}
          >
            <span className="text-sm" style={{ color: 'var(--foodchain-espresso)', fontWeight: 500 }}>
              Demo Credentials
            </span>
            {showDemoCredentials ? (
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--foodchain-espresso)' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--foodchain-espresso)' }} />
            )}
          </button>

          {showDemoCredentials && (
            <div
              className="mt-2 p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--foodchain-white)',
                borderColor: 'var(--foodchain-espresso)',
                borderWidth: '1px',
                borderStyle: 'solid',
                opacity: 0.95
              }}
            >
              <p className="text-xs mb-3" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                Use these test accounts to explore different user roles
              </p>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <div
                    key={account.role}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ backgroundColor: 'var(--foodchain-warm-white)' }}
                  >
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: 'var(--foodchain-espresso)', fontWeight: 500 }}>
                        {account.role}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                        {account.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => useDemoCredentials(account.email, account.password)}
                      className="text-xs h-7 px-3"
                      style={{
                        backgroundColor: 'var(--foodchain-golden-amber)',
                        color: 'var(--foodchain-charcoal)'
                      }}
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
