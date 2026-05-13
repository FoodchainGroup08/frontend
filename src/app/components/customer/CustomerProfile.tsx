import { useState } from "react";
import { User, MapPin, Save, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { updateProfile } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface CustomerProfileProps {
  onGoBack: () => void;
}

async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number }> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.[0]) {
    throw new Error('Address not found. Try being more specific (include city/state).');
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

export function CustomerProfile({ onGoBack }: CustomerProfileProps) {
  const { user, refreshUser } = useAuth();

  const [addressInput, setAddressInput] = useState(user?.addressLine ?? '');
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!addressInput.trim() && nameInput === user?.name) return;

    setIsSaving(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {};

      if (nameInput.trim() && nameInput !== user?.name) {
        payload.name = nameInput.trim();
      }

      if (addressInput.trim()) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const { lat, lng } = await geocodeAddress(addressInput.trim(), apiKey);
        payload.addressLine = addressInput.trim();
        payload.latitude = lat;
        payload.longitude = lng;
      }

      if (Object.keys(payload).length === 0) return;

      await updateProfile(payload);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={onGoBack}
          className="flex items-center gap-2 mb-6 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--foodchain-espresso)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-3xl mb-8" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
          My Profile
        </h1>

        <div className="space-y-6">
          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--foodchain-espresso)' }}>
                <User className="w-5 h-5" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--foodchain-espresso)',
                    borderOpacity: 0.2,
                    color: 'var(--foodchain-espresso)',
                    backgroundColor: 'var(--foodchain-warm-white)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{
                    borderColor: 'var(--foodchain-espresso)',
                    color: 'var(--foodchain-espresso)',
                    backgroundColor: 'var(--foodchain-warm-white)',
                    opacity: 0.5,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--foodchain-espresso)]/10" style={{ backgroundColor: 'var(--foodchain-white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--foodchain-espresso)' }}>
                <MapPin className="w-5 h-5" />
                Saved Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', opacity: 0.6 }}>
                Your saved address is used to find nearby branches automatically. Enter a full address including city and state for best results.
              </p>

              {user?.addressLine && (
                <div className="flex items-start gap-2 p-3 rounded-md" style={{ backgroundColor: 'var(--foodchain-warm-white)' }}>
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--foodchain-sage-green)' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--foodchain-espresso)', fontWeight: 600 }}>
                      {user.addressLine}
                    </p>
                    {user.latitude && user.longitude && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--foodchain-espresso)', opacity: 0.5 }}>
                        {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}>
                  {user?.addressLine ? 'Update address' : 'Enter your delivery address'}
                </label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  placeholder="e.g. 123 Awolowo Road, Ikoyi, Lagos"
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--foodchain-espresso)',
                    color: 'var(--foodchain-espresso)',
                    backgroundColor: 'var(--foodchain-warm-white)',
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2"
            style={{ backgroundColor: 'var(--foodchain-espresso)', color: 'var(--foodchain-warm-white)' }}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
