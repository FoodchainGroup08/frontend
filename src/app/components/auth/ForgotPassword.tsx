import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

interface ForgotPasswordProps {
  onNavigateToLogin: () => void;
  onResetSuccess: () => void;
}

export function ForgotPassword({ onNavigateToLogin, onResetSuccess }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setEmailSent(true);
      setIsLoading(false);
    }, 1000);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#3B2314"/>
                <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="#F0A500"/>
                <circle cx="20" cy="20" r="4" fill="#FAF7F2"/>
              </svg>
              <h1 className="text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>FoodChain</h1>
            </div>
            <p className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
              Multi-branch Restaurant Management
            </p>
          </div>

          <Card className="border-0 shadow-xl" style={{ backgroundColor: 'white' }}>
            <CardHeader className="space-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: '#4CAF7D', opacity: 0.1 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#4CAF7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <CardTitle className="text-2xl text-center" style={{ color: '#3B2314' }}>Check your email</CardTitle>
              <CardDescription className="text-center" style={{ color: '#3B2314', opacity: 0.7 }}>
                We've sent password reset instructions to <span style={{ fontWeight: 600 }}>{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-center" style={{ color: '#3B2314', opacity: 0.7 }}>
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                onClick={onNavigateToLogin}
                className="w-full transition-all hover:opacity-90"
                style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}
              >
                Back to Login
              </Button>
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full border-[#3B2314]/20"
                style={{ color: '#3B2314' }}
              >
                Resend Email
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#3B2314"/>
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="#F0A500"/>
              <circle cx="20" cy="20" r="4" fill="#FAF7F2"/>
            </svg>
            <h1 className="text-3xl" style={{ color: '#3B2314', fontWeight: 600 }}>FoodChain</h1>
          </div>
          <p className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
            Multi-branch Restaurant Management
          </p>
        </div>

        <Card className="border-0 shadow-xl" style={{ backgroundColor: 'white' }}>
          <CardHeader className="space-y-1">
            <button
              onClick={onNavigateToLogin}
              className="flex items-center gap-2 text-sm mb-2 hover:opacity-70 transition-opacity"
              style={{ color: '#3B2314' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
            <CardTitle className="text-2xl" style={{ color: '#3B2314' }}>Forgot Password?</CardTitle>
            <CardDescription style={{ color: '#3B2314', opacity: 0.7 }}>
              Enter your email address and we'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: '#3B2314' }}>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full transition-all hover:opacity-90 hover:shadow-lg"
                disabled={isLoading}
                style={{ backgroundColor: '#F0A500', color: '#1E1E1E' }}
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
