import { useState } from "react";
import { User, MapPin, Save, ArrowLeft, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { updateProfile } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  DIETARY_RESTRICTION_OPTIONS,
  CUISINE_PREFERENCE_OPTIONS,
  SPICE_LEVEL_OPTIONS,
  normalizePrefKey,
} from "@/constants/recommendation";
import type { FoodPreferences } from "./HelpMeChooseSheet";

function PrefsKey(userId: string) {
  return `foodchain_food_prefs_${userId}`;
}

function loadFoodPrefs(userId: string): FoodPreferences {
  try {
    const raw = localStorage.getItem(PrefsKey(userId));
    if (!raw) return { dietary: [], cuisines: [], spice: null };
    const p = JSON.parse(raw);
    return {
      dietary: (p.dietary ?? []).map(normalizePrefKey),
      cuisines: (p.cuisines ?? []).map(normalizePrefKey),
      spice: p.spice ? normalizePrefKey(p.spice) : null,
    };
  } catch {
    return { dietary: [], cuisines: [], spice: null };
  }
}

// ─── Chip button ──────────────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
      style={{
        backgroundColor: selected ? 'var(--espresso)' : 'transparent',
        color: selected ? 'var(--warm-white)' : 'var(--espresso)',
        borderColor: selected
          ? 'var(--espresso)'
          : 'color-mix(in srgb, var(--espresso) 20%, transparent)',
      }}
    >
      {label}
    </button>
  );
}

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

  const [foodPrefs, setFoodPrefs] = useState<FoodPreferences>(() =>
    user?.id ? loadFoodPrefs(user.id) : { dietary: [], cuisines: [], spice: null },
  );

  const toggleDietary = (key: string) => {
    setFoodPrefs((p) => {
      if (key === 'no_restrictions') {
        return { ...p, dietary: p.dietary.includes('no_restrictions') ? [] : ['no_restrictions'] };
      }
      const without = p.dietary.filter((d) => d !== 'no_restrictions');
      return {
        ...p,
        dietary: without.includes(key) ? without.filter((d) => d !== key) : [...without, key],
      };
    });
  };

  const toggleCuisine = (key: string) => {
    setFoodPrefs((p) => {
      if (key === 'any') {
        return { ...p, cuisines: p.cuisines.includes('any') ? [] : ['any'] };
      }
      const without = p.cuisines.filter((c) => c !== 'any');
      return {
        ...p,
        cuisines: without.includes(key) ? without.filter((c) => c !== key) : [...without, key],
      };
    });
  };

  const toggleSpice = (key: string) => {
    setFoodPrefs((p) => ({ ...p, spice: p.spice === key ? null : key }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const profilePayload: Parameters<typeof updateProfile>[0] = {};

      if (nameInput.trim() && nameInput !== user?.name) {
        profilePayload.name = nameInput.trim();
      }
      if (addressInput.trim() && addressInput !== user?.addressLine) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const { lat, lng } = await geocodeAddress(addressInput.trim(), apiKey);
        profilePayload.addressLine = addressInput.trim();
        profilePayload.latitude = lat;
        profilePayload.longitude = lng;
      }

      if (Object.keys(profilePayload).length > 0) {
        await updateProfile(profilePayload);
        await refreshUser();
      }

      if (user?.id) {
        localStorage.setItem(PrefsKey(user.id), JSON.stringify(foodPrefs));
      }

      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={onGoBack}
          className="flex items-center gap-2 mb-6 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--espresso)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-3xl mb-8" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
          My Profile
        </h1>

        <div className="space-y-6">
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                <User className="w-5 h-5" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--espresso)',
                    borderOpacity: 0.2,
                    color: 'var(--espresso)',
                    backgroundColor: 'var(--warm-white)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{
                    borderColor: 'var(--espresso)',
                    color: 'var(--espresso)',
                    backgroundColor: 'var(--warm-white)',
                    opacity: 0.5,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                <MapPin className="w-5 h-5" />
                Saved Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                Your saved address is used to find nearby branches automatically. Enter a full address including city and state for best results.
              </p>

              {user?.addressLine && (
                <div className="flex items-start gap-2 p-3 rounded-md" style={{ backgroundColor: 'var(--warm-white)' }}>
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sage-green)' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--espresso)', fontWeight: 600 }}>
                      {user.addressLine}
                    </p>
                    {user.latitude && user.longitude && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--espresso)', opacity: 0.5 }}>
                        {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                  {user?.addressLine ? 'Update address' : 'Enter your delivery address'}
                </label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  placeholder="e.g. 123 Awolowo Road, Ikoyi, Lagos"
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--espresso)',
                    color: 'var(--espresso)',
                    backgroundColor: 'var(--warm-white)',
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Food Preferences ─────────────────────────────────────────── */}
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                <UtensilsCrossed className="w-5 h-5" />
                Food Preferences
              </CardTitle>
              <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.55 }}>
                Optional — helps us give you better suggestions.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium mb-2.5" style={{ color: 'var(--espresso)' }}>
                  Dietary
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_RESTRICTION_OPTIONS.map(({ key, label }) => (
                    <Chip
                      key={key}
                      label={label}
                      selected={foodPrefs.dietary.includes(key)}
                      onClick={() => toggleDietary(key)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2.5" style={{ color: 'var(--espresso)' }}>
                  Favourite Cuisine
                </p>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_PREFERENCE_OPTIONS.map(({ key, label }) => (
                    <Chip
                      key={key}
                      label={label}
                      selected={foodPrefs.cuisines.includes(key)}
                      onClick={() => toggleCuisine(key)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2.5" style={{ color: 'var(--espresso)' }}>
                  Spice Level
                </p>
                <div className="flex flex-wrap gap-2">
                  {SPICE_LEVEL_OPTIONS.map(({ key, label }) => (
                    <Chip
                      key={key}
                      label={label}
                      selected={foodPrefs.spice === key}
                      onClick={() => toggleSpice(key)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="w-full gap-2"
            style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}
