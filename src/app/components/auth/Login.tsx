import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface LoginProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export function Login({ onNavigateToRegister, onNavigateToForgotPassword }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
    } catch {
      toast.error("Login failed", { description: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.info("Coming soon", { description: "Google sign-in is not yet available" });
  };

  const useDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.success("Demo credentials loaded", { description: "Click 'Sign in' to continue" });
  };

  const demoAccounts = [
    { role: "Customer", email: "customer@demo.com", password: "demo123" },
    { role: "Kitchen Staff", email: "kitchen@demo.com", password: "demo123" },
    { role: "Branch Manager", email: "manager@demo.com", password: "demo123" },
    { role: "Admin", email: "admin@demo.com", password: "demo123" }
  ];

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
            <CardTitle className="text-2xl" style={{ color: '#3B2314' }}>Welcome back</CardTitle>
            <CardDescription style={{ color: '#3B2314', opacity: 0.7 }}>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: '#3B2314' }}>Email</Label>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" style={{ color: '#3B2314' }}>Password</Label>
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-sm hover:underline"
                    style={{ color: '#F0A500' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full mt-5 transition-all hover:opacity-90 hover:shadow-lg"
                disabled={isLoading}
                style={{
                  backgroundColor: '#F0A500',
                  color: '#1E1E1E'
                }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="relative w-full">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs" style={{ color: '#3B2314', opacity: 0.6 }}>
                  OR
                </span>
              </div>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full border-[#3B2314]/20 gap-2"
                style={{ color: '#3B2314' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </Button>

              <div className="text-center text-sm">
                <span style={{ color: '#3B2314', opacity: 0.7 }}>Don't have an account? </span>
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="underline"
                  style={{ color: '#F0A500' }}
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
              backgroundColor: '#FAF7F2',
              borderColor: '#3B2314',
              borderWidth: '1px',
              borderStyle: 'solid',
              opacity: 0.9
            }}
          >
            <span className="text-sm" style={{ color: '#3B2314', fontWeight: 500 }}>
              Demo Credentials
            </span>
            {showDemoCredentials ? (
              <ChevronUp className="w-4 h-4" style={{ color: '#3B2314' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: '#3B2314' }} />
            )}
          </button>

          {showDemoCredentials && (
            <div
              className="mt-2 p-4 rounded-lg border"
              style={{
                backgroundColor: 'white',
                borderColor: '#3B2314',
                borderWidth: '1px',
                borderStyle: 'solid',
                opacity: 0.95
              }}
            >
              <p className="text-xs mb-3" style={{ color: '#3B2314', opacity: 0.7 }}>
                Use these test accounts to explore different user roles
              </p>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <div
                    key={account.role}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ backgroundColor: '#FAF7F2' }}
                  >
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: '#3B2314', fontWeight: 500 }}>
                        {account.role}
                      </p>
                      <p className="text-xs" style={{ color: '#3B2314', opacity: 0.6 }}>
                        {account.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => useDemoCredentials(account.email, account.password)}
                      className="text-xs h-7 px-3"
                      style={{
                        backgroundColor: '#F0A500',
                        color: '#1E1E1E'
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
