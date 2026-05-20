import { saveDeliveryLocation } from '@/services/locationService';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from "react-router";
import { Button } from '../ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LocationPicker } from './LocationPicker';

interface SetupLocationProps {
  userName?: string;
  onComplete: () => void;
}

export function SetupLocation({ userName, onComplete }: SetupLocationProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) { setError('Phone number is required'); return; }
    if (!deliveryLocation.trim()) { setError('Please enter your delivery location'); return; }

    saveDeliveryLocation(deliveryLocation);
    localStorage.setItem('foodchain_phone_number', phoneNumber.trim());
    onComplete();
  };

  const firstName = userName?.split(' ')[0];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--warm-white)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="var(--brown)" />
              <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--golden-amber)" />
              <circle cx="20" cy="20" r="4" fill="var(--warm-white)" />
            </svg>
            <h1 className="text-3xl" style={{ color: 'var(--brown)', fontWeight: 600 }}>FoodChain</h1>
          </Link>
          <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.7 }}>
            Multi-branch Restaurant Management
          </p>
        </div>

        <Card className="border-0 shadow-xl" style={{ backgroundColor: 'var(--white)' }}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl" style={{ color: 'var(--brown)' }}>
              {firstName ? `Welcome, ${firstName}!` : 'One more step'}
            </CardTitle>
            <CardDescription style={{ color: 'var(--brown)', opacity: 0.7 }}>
              Set up your delivery details to start ordering.
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

              <div
                className="p-3 rounded-lg flex items-start gap-3"
                style={{ backgroundColor: 'rgba(240, 165, 0, 0.08)' }}
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--golden-amber)' }} />
                <p className="text-sm" style={{ color: 'var(--brown)', opacity: 0.85 }}>
                  Your delivery address will be pre-filled on every order. You can always change it at checkout.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" style={{ color: 'var(--brown)' }}>Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="080 1234 5678"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  required
                  className="border-[var(--brown)]/20"
                  style={{ backgroundColor: 'var(--white)' }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: 'var(--brown)' }}>Delivery Location</Label>
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
                style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
              >
                Get started
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
