import { useState } from 'react';
import { Link } from "react-router";
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { postResetPassword } from '@/services/api';

interface ResetPasswordProps {
  token: string;
  onNavigateToLogin: () => void;
}

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$!%*?&\-_+=]).{8,}$/;

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter';
  if (!/\d/.test(pw)) return 'Password must contain at least one digit';
  if (!/[@#$!%*?&\-_+=]/.test(pw)) return 'Password must contain at least one special character (@#$!%*?&-_+=)';
  return null;
}

export function ResetPassword({ token, onNavigateToLogin }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword(password);
    if (validationError) { setError(validationError); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      const response = await postResetPassword(token, password);
      setSuccess(true);
      toast.success(response.message || 'Password updated successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'The reset link may be invalid or expired';
      setError(msg);
      toast.error('Failed to reset password', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--warm-white)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="var(--espresso)" />
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--golden-amber)" />
              <circle cx="20" cy="20" r="4" fill="var(--warm-white)" />
            </svg>
            <h1 className="text-3xl" style={{ color: 'var(--espresso)', fontWeight: 600 }}>FoodChain</h1>
          </Link>
          <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
            Multi-branch Restaurant Management
          </p>
        </div>

        <Card className="border-0 shadow-xl" style={{ backgroundColor: 'var(--white)' }}>
          {success ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center" style={{ color: 'var(--espresso)' }}>
                  Password updated
                </CardTitle>
                <CardDescription className="text-center" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                  Your password has been reset successfully.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  onClick={onNavigateToLogin}
                  className="w-full transition-all hover:opacity-90"
                  style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
                >
                  Back to Login
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl" style={{ color: 'var(--espresso)' }}>
                  Reset Password
                </CardTitle>
                <CardDescription style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                  Enter a new password for your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <div
                      className="p-3 rounded-md text-sm"
                      style={{ backgroundColor: 'var(--burnt-orange)', color: 'var(--white)' }}
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" style={{ color: 'var(--espresso)' }}>New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="border-[var(--espresso)]/20 pr-10"
                        style={{ backgroundColor: 'var(--white)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--espresso)', opacity: 0.5 }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--espresso)', opacity: 0.55 }}>
                      Min. 8 chars · uppercase · lowercase · digit · special (@#$!%*?&amp;-_+=)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" style={{ color: 'var(--espresso)' }}>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        className="border-[var(--espresso)]/20 pr-10"
                        style={{ backgroundColor: 'var(--white)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--espresso)', opacity: 0.5 }}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full transition-all hover:opacity-90 hover:shadow-lg"
                    disabled={isLoading}
                    style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
                  >
                    {isLoading ? 'Updating…' : 'Set New Password'}
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
