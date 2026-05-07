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
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const nearby = await getBranchesNearby(pos.coords.latitude, pos.coords.longitude);
              setBranches(nearby);
            } catch {
              const all = await getBranches();
              setBranches(all);
            } finally {
              setIsLoading(false);
            }
          },
          async () => {
            try {
              const all = await getBranches();
              setBranches(all);
            } catch {
              setError("Failed to load branches");
            } finally {
              setIsLoading(false);
            }
          }
        );
      } else {
        const all = await getBranches();
        setBranches(all);
        setIsLoading(false);
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
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#3B2314"/>
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="#F0A500"/>
              <circle cx="20" cy="20" r="4" fill="#FAF7F2"/>
            </svg>
            <div>
              <h2 className="text-lg" style={{ color: '#3B2314', fontWeight: 600 }}>FoodChain</h2>
              {userName && (
                <p className="text-sm" style={{ color: '#3B2314', opacity: 0.6 }}>
                  {userName}
                </p>
              )}
            </div>
          </div>
          {onLogout && (
            <Button
              onClick={onLogout}
              variant="outline"
              className="gap-2 border-[#3B2314]/20"
              style={{ color: '#3B2314' }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl mb-3" style={{ color: '#3B2314', fontWeight: 600 }}>
            Select Your Branch
          </h1>
          <p className="text-base sm:text-lg" style={{ color: '#3B2314', opacity: 0.7 }}>
            Choose a FoodChain location near you
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
            <p className="mb-4" style={{ color: '#E8622A' }}>{error}</p>
            <Button
              onClick={fetchBranches}
              variant="outline"
              className="border-[#3B2314]/20"
              style={{ color: '#3B2314' }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {branches.map((branch) => (
              <Card
                key={branch.id}
                className="cursor-pointer transition-all hover:shadow-lg border-[#3B2314]/10"
                onClick={() => branch.isOpen && onSelectBranch(branch)}
                style={{
                  backgroundColor: 'white',
                  opacity: branch.isOpen ? 1 : 0.6
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg sm:text-xl" style={{ color: '#3B2314' }}>
                          {branch.name}
                        </CardTitle>
                        {branch.isOpen ? (
                          <Badge className="border-0" style={{ backgroundColor: '#4CAF7D', color: 'white' }}>
                            Open
                          </Badge>
                        ) : (
                          <Badge className="border-0" style={{ backgroundColor: '#E8622A', color: 'white' }}>
                            Closed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4" style={{ color: '#F0A500', fill: '#F0A500' }} />
                        <span className="text-sm" style={{ color: '#3B2314', fontWeight: 600 }}>
                          {branch.rating}
                        </span>
                      </div>
                    </div>
                    {branch.distance && (
                      <div className="text-right">
                        <p className="text-sm" style={{ color: '#F0A500', fontWeight: 600 }}>
                          {branch.distance}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3B2314', opacity: 0.6 }} />
                      <CardDescription className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                        {branch.address || branch.location}
                      </CardDescription>
                    </div>
                    {branch.hours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#3B2314', opacity: 0.6 }} />
                        <CardDescription className="text-sm" style={{ color: '#3B2314', opacity: 0.7 }}>
                          {branch.hours}
                        </CardDescription>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
