import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface RegisterProps {
  onNavigateToLogin: () => void;
}

export function Register({ onNavigateToLogin }: RegisterProps) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created successfully!", { description: `Welcome to FoodChain, ${name}!` });
    } catch {
      toast.error("Registration failed", { description: "Please try again" });
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12" style={{ backgroundColor: '#444' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#3B2314"/>
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="#F0A500"/>
              <circle cx="20" cy="20" r="4" fill="#FAF7F2"/>
            </svg>
            <h1 className="text-3xl" style={{ color: '#FAF7F2', fontWeight: 600 }}>FoodChain</h1>
          </div>
          <p className="text-sm" style={{ color: '#FAF7F2', opacity: 0.7 }}>
            Multi-branch Restaurant Management
          </p>
        </div>

        <Card className="border-0 shadow-xl" style={{ backgroundColor: '#FAF7F2' }}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl" style={{ color: '#3B2314' }}>Create an account</CardTitle>
            <CardDescription style={{ color: '#3B2314', opacity: 0.7 }}>
              Enter your information to get started
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div
                  className="p-3 rounded-md text-sm"
                  style={{ backgroundColor: '#E8622A', color: 'white' }}
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: '#3B2314' }}>Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>

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
                <Label htmlFor="password" style={{ color: '#3B2314' }}>Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" style={{ color: '#3B2314' }}>Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-[#3B2314]/20"
                  style={{ backgroundColor: 'white' }}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full transition-all mt-4 hover:opacity-90 hover:shadow-lg"
                disabled={isLoading}
                style={{
                  backgroundColor: '#F0A500',
                  color: '#1E1E1E'
                }}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
              <div className="text-center text-sm">
                <span style={{ color: '#3B2314', opacity: 0.7 }}>Already have an account? </span>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="underline"
                  style={{ color: '#F0A500' }}
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
