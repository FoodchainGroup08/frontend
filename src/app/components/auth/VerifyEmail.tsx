import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { getVerifyEmail, postResendVerification } from '@/services/api';

interface VerifyEmailProps {
  token?: string;
  email?: string;
  onNavigateToLogin: () => void;
}

export function VerifyEmail({ token, email, onNavigateToLogin }: VerifyEmailProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    setStatus('verifying');
    getVerifyEmail(token)
      .then(() => {
        setStatus('success');
        toast.success('Email verified! You can now sign in.');
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'The verification link may be invalid or expired.';
        setErrorMsg(msg);
        setStatus('error');
      });
  }, [token]);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      const response = await postResendVerification(email);
      toast.success(response.message || 'Verification email sent', { description: `Check ${email} for a new link.` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not resend verification email';
      toast.error('Failed to resend', { description: msg });
    } finally {
      setIsResending(false);
    }
  };

  const Logo = () => (
    <div className="mb-8 text-center">
      <div className="inline-flex items-center gap-2 mb-2">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="8" fill="var(--foodchain-espresso)" />
          <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--foodchain-golden-amber)" />
          <circle cx="20" cy="20" r="4" fill="var(--foodchain-warm-white)" />
        </svg>
        <h1 className="text-3xl" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>FoodChain</h1>
      </div>
      <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
        Multi-branch Restaurant Management
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="w-full max-w-md">
        <Logo />

        <Card className="border-0 shadow-xl" style={{ backgroundColor: 'var(--foodchain-white)' }}>
          {/* Verifying */}
          {status === 'verifying' && (
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl" style={{ color: 'var(--foodchain-espresso)' }}>Verifying…</CardTitle>
              <CardDescription style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                Please wait while we verify your email address.
              </CardDescription>
            </CardHeader>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(76, 175, 125, 0.15)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="var(--foodchain-sage-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="text-2xl" style={{ color: 'var(--foodchain-espresso)' }}>Email verified!</CardTitle>
                <CardDescription style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                  Your account is now active. Sign in to start ordering.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={onNavigateToLogin} className="w-full hover:opacity-90" style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}>
                  Sign in
                </Button>
              </CardFooter>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl" style={{ color: 'var(--foodchain-espresso)' }}>Verification failed</CardTitle>
                <CardDescription style={{ color: 'var(--foodchain-burnt-orange)' }}>
                  {errorMsg}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={onNavigateToLogin} className="w-full hover:opacity-90" style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}>
                  Back to Login
                </Button>
              </CardFooter>
            </>
          )}

          {/* Check inbox (no token) */}
          {!token && status === 'idle' && (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(240, 165, 0, 0.1)' }}>
                    <Mail className="w-8 h-8" style={{ color: 'var(--foodchain-golden-amber)' }} />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center" style={{ color: 'var(--foodchain-espresso)' }}>Check your inbox</CardTitle>
                <CardDescription className="text-center" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                  We sent a verification link to{' '}
                  {email && <span style={{ fontWeight: 600 }}>{email}</span>}
                  {!email && 'your email address'}. Tap the link to activate your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                  Didn't receive it? Check your spam folder or contact support.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                {email && (
                  <Button
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full hover:opacity-90"
                    style={{ backgroundColor: 'var(--foodchain-golden-amber)', color: 'var(--foodchain-charcoal)' }}
                  >
                    {isResending ? 'Sending…' : 'Resend verification email'}
                  </Button>
                )}
                <Button onClick={onNavigateToLogin} variant="outline" className="w-full border-[var(--foodchain-espresso)]/20" style={{ color: 'var(--foodchain-espresso)' }}>
                  Back to Login
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
