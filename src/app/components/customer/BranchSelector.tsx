import { useEffect, useState } from "react";
import { MapPin, Clock, Star, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getBranches, getBranchesNearby, type Branch } from "@/services/api";

interface BranchSelectorProps {
  onSelectBranch: (branch: Branch) => void;
  onLogout?: () => void;
  userName?: string;
}

export function BranchSelector({ onSelectBranch, onLogout, userName }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBranches = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Load all branches immediately — don't wait for geolocation
      const all = await getBranches();
      setBranches(all);
      setIsLoading(false);

      // Then, non-blocking, try to sort by proximity
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const nearby = await getBranchesNearby(
                pos.coords.latitude,
                pos.coords.longitude
              );
              setBranches(nearby);
            } catch {
              /* silent — keep the already-loaded all-branches list */
            }
          },
          () => { /* user denied or timeout — keep existing list */ },
          { timeout: 8000, maximumAge: 300_000 }
        );
      }
    } catch {
      setError("Failed to load branches");
      toast.error("Failed to load branches");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="var(--foodchain-espresso)"/>
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--foodchain-golden-amber)"/>
              <circle cx="20" cy="20" r="4" fill="var(--foodchain-warm-white)"/>
            </svg>
            <div>
              <h2 className="text-lg" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>FoodChain</h2>
              {userName && (
                <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                  {userName}
                </p>
              )}
            </div>
          </div>
          {onLogout && (
            <Button
              onClick={onLogout}
              variant="outline"
              className="gap-2 border-[var(--foodchain-espresso)]/20"
              style={{ color: 'var(--foodchain-espresso)' }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl mb-3" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
            Select Your Branch
          </h1>
          <p className="text-base sm:text-lg" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
            Choose a FoodChain location near you to continue
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="mb-4" style={{ color: 'var(--foodchain-burnt-orange)' }}>{error}</p>
            <Button
              onClick={fetchBranches}
              variant="outline"
              className="border-[var(--foodchain-espresso)]/20"
              style={{ color: 'var(--foodchain-espresso)' }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {branches.map((branch, index) => {
              const isSuggested = index === 0;
              return (
              <Card
                key={branch.id}
                className="cursor-pointer transition-all hover:shadow-lg border-[var(--foodchain-espresso)]/10"
                onClick={() => branch.isOpen && onSelectBranch(branch)}
                style={{
                  backgroundColor: 'var(--foodchain-white)',
                  opacity: branch.isOpen ? 1 : 0.6,
                  borderColor: isSuggested ? 'var(--foodchain-golden-amber)' : undefined,
                  boxShadow: isSuggested ? '0 0 0 1px rgba(240, 165, 0, 0.2), 0 8px 18px rgba(240, 165, 0, 0.14)' : undefined
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg sm:text-xl" style={{ color: 'var(--foodchain-espresso)' }}>
                          {branch.name}
                        </CardTitle>
                        {isSuggested && (
                          <Badge
                            className="border-0"
                            style={{
                              backgroundColor: 'rgba(240, 165, 0, 0.18)',
                              color: 'var(--foodchain-espresso)'
                            }}
                          >
                            Fastest delivery
                          </Badge>
                        )}
                        {branch.isOpen ? (
                          <Badge className="border-0" style={{ backgroundColor: 'var(--foodchain-sage-green)', color: 'var(--foodchain-white)' }}>
                            Open
                          </Badge>
                        ) : (
                          <Badge className="border-0" style={{ backgroundColor: 'var(--foodchain-burnt-orange)', color: 'var(--foodchain-white)' }}>
                            Closed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4" style={{ color: 'var(--foodchain-golden-amber)', fill: 'var(--foodchain-golden-amber)' }} />
                        <span className="text-sm" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                          {branch.rating}
                        </span>
                      </div>
                    </div>
                    {branch.distance && (
                      <div className="text-right">
                        <p className="text-sm" style={{ color: 'var(--foodchain-golden-amber)', fontWeight: 600 }}>
                          {branch.distance}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }} />
                      <CardDescription className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                        {branch.address || branch.location}
                      </CardDescription>
                    </div>
                    {branch.hours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }} />
                        <CardDescription className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                          {branch.hours}
                        </CardDescription>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}