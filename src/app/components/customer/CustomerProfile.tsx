import { useState, useEffect } from "react";
import { User, MapPin, Save, ArrowLeft, UtensilsCrossed, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { updateProfile, getUserPreferencesV2, saveUserPreferencesV2, type SavePreferencesV2Request } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { geocodeAddressText } from "@/services/locationService";
import { LocationPicker } from "../auth/LocationPicker";

// ─── Option lists (aligned with v2 API) ──────────────────────────────────────

const DIETARY_OPTIONS = [
  { id: 'vegetarian',  label: 'Vegetarian' },
  { id: 'vegan',       label: 'Vegan' },
  { id: 'halal',       label: 'Halal' },
  { id: 'gluten_free', label: 'Gluten Free' },
  { id: 'dairy_free',  label: 'Dairy Free' },
  { id: 'nut_free',    label: 'Nut Free' },
  { id: 'no_pork',     label: 'No Pork' },
  { id: 'no_seafood',  label: 'No Seafood' },
];

const HEALTH_GOAL_OPTIONS = [
  { id: 'no_restrictions', label: 'No restrictions' },
  { id: 'eating_healthy',  label: 'Eating healthy' },
  { id: 'low_calorie',     label: 'Low calorie' },
  { id: 'high_protein',    label: 'High protein' },
  { id: 'weight_loss',     label: 'Weight loss' },
];

const ALLERGY_OPTIONS = [
  { id: 'nuts',      label: 'Nuts' },
  { id: 'dairy',     label: 'Dairy' },
  { id: 'eggs',      label: 'Eggs' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'gluten',    label: 'Gluten' },
  { id: 'soy',       label: 'Soy' },
];

const CUISINE_OPTIONS = [
  { id: 'nigerian',    label: '🇳🇬 Nigerian' },
  { id: 'continental', label: '🌍 Continental' },
  { id: 'asian',       label: '🥢 Asian' },
  { id: 'italian',     label: '🍝 Italian' },
  { id: 'fast_food',   label: '🍔 Fast Food' },
];

const SPICE_OPTIONS = [
  { id: 'spice_none',      label: 'None',      emoji: '💧' },
  { id: 'spice_mild',      label: 'Mild',      emoji: '🌿' },
  { id: 'spice_medium',    label: 'Medium',    emoji: '🌶️' },
  { id: 'spice_hot',       label: 'Hot',       emoji: '🔥' },
  { id: 'spice_extra_hot', label: 'Extra Hot', emoji: '🌋' },
];

const TASTE_OPTIONS = [
  { id: 'savoury', label: 'Savoury' },
  { id: 'sweet',   label: 'Sweet' },
  { id: 'smoky',   label: 'Smoky' },
  { id: 'tangy',   label: 'Tangy' },
  { id: 'umami',   label: 'Umami' },
];

const APPETITE_OPTIONS = [
  { id: 'light',   label: 'Light',   desc: 'Small portions' },
  { id: 'regular', label: 'Regular', desc: 'Standard portions' },
  { id: 'large',   label: 'Large',   desc: 'Generous portions' },
];

const MEAL_TIME_OPTIONS = [
  { id: 'breakfast',  label: 'Breakfast' },
  { id: 'brunch',     label: 'Brunch' },
  { id: 'lunch',      label: 'Lunch' },
  { id: 'dinner',     label: 'Dinner' },
  { id: 'late_night', label: 'Late Night' },
];

const ORDER_FREQUENCY_OPTIONS = [
  { id: 'daily',          label: 'Daily' },
  { id: 'few_times_week', label: 'Few times/week' },
  { id: 'weekends_only',  label: 'Weekends only' },
  { id: 'occasionally',   label: 'Occasionally' },
];

const GROUP_SIZE_OPTIONS = [
  { id: 'solo',        label: 'Solo',       emoji: '🧍' },
  { id: 'two_people',  label: 'Couple',     emoji: '👫' },
  { id: 'family',      label: 'Family',     emoji: '👨‍👩‍👧' },
  { id: 'large_group', label: 'Large group',emoji: '👥' },
];

const BUDGET_PRESETS = [
  { label: 'Under ₦5k',    value: 4999 },
  { label: '₦5k – ₦10k',  value: 10000 },
  { label: '₦10k – ₦20k', value: 20000 },
  { label: 'No limit',     value: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function syncToLocalStorage(userId: string, prefs: SavePreferencesV2Request) {
  const spiceMap: Record<string, string> = {
    spice_mild: 'mild', spice_medium: 'medium',
    spice_hot: 'spicy', spice_extra_hot: 'spicy', spice_none: 'mild',
  };
  localStorage.setItem(
    `foodchain_food_prefs_${userId}`,
    JSON.stringify({
      dietary: prefs.dietaryRestrictions,
      cuisines: prefs.cuisinePreferences,
      spice: prefs.spiceLevel ? (spiceMap[prefs.spiceLevel] ?? null) : null,
    }),
  );
}


// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium mb-2.5" style={{ color: 'var(--espresso)' }}>
      {children}
    </p>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
      style={{
        backgroundColor: selected ? 'var(--espresso)' : 'transparent',
        color: selected ? 'var(--warm-white)' : 'var(--espresso)',
        borderColor: selected ? 'var(--espresso)' : 'color-mix(in srgb, var(--espresso) 20%, transparent)',
      }}
    >
      {label}
    </button>
  );
}

function SingleSelectGrid({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { id: string; label: string; desc?: string; emoji?: string }[];
  value: string | null;
  onChange: (id: string) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(o => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="py-2.5 px-3 rounded-xl text-sm font-medium border-2 text-left transition-colors flex items-center gap-2"
            style={{
              backgroundColor: selected ? 'color-mix(in srgb, var(--espresso) 10%, transparent)' : 'transparent',
              borderColor: selected ? 'var(--espresso)' : 'color-mix(in srgb, var(--espresso) 15%, transparent)',
              color: 'var(--espresso)',
            }}
          >
            {o.emoji && <span className="text-base">{o.emoji}</span>}
            <span className="flex flex-col">
              <span>{o.label}</span>
              {o.desc && <span className="text-xs font-normal opacity-60">{o.desc}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomerProfileProps {
  onGoBack: () => void;
  onChangeBranch?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomerProfile({ onGoBack, onChangeBranch }: CustomerProfileProps) {
  const { user, refreshUser } = useAuth();

  const [addressInput, setAddressInput] = useState(user?.addressLine ?? '');
  const [nameInput, setNameInput]       = useState(user?.name ?? '');
  const [isSaving, setIsSaving]         = useState(false);

  // ── Preferences state ────────────────────────────────────────────────────
  const [dietary, setDietary]           = useState<string[]>([]);
  const [healthGoal, setHealthGoal]     = useState<string | null>(null);
  const [allergies, setAllergies]       = useState<string[]>([]);
  const [cuisines, setCuisines]         = useState<string[]>([]);
  const [spice, setSpice]               = useState<string | null>(null);
  const [taste, setTaste]               = useState<string[]>([]);
  const [dislikedInput, setDislikedInput] = useState('');
  const [disliked, setDisliked]         = useState<string[]>([]);
  const [appetite, setAppetite]         = useState<string | null>(null);
  const [mealTimes, setMealTimes]       = useState<string[]>([]);
  const [frequency, setFrequency]       = useState<string | null>(null);
  const [groupSize, setGroupSize]       = useState<string | null>(null);
  const [budgetPreset, setBudgetPreset] = useState<number | null | undefined>(undefined);

  // Load v2 preferences on mount
  useEffect(() => {
    if (!user?.id) return;
    getUserPreferencesV2()
      .then(prefs => {
        setDietary(prefs.dietaryRestrictions ?? []);
        setCuisines(prefs.cuisinePreferences ?? []);
        setSpice(prefs.spiceLevel ?? null);
        setHealthGoal(prefs.healthGoal ?? null);
        setAllergies(prefs.foodAllergies ?? []);
        setTaste(prefs.tastePreferences ?? []);
        setDisliked(prefs.dislikedIngredients ?? []);
        setAppetite(prefs.appetiteSize ?? null);
        setMealTimes(prefs.usualMealTimes ?? []);
        setFrequency(prefs.orderFrequency ?? null);
        setGroupSize(prefs.typicalGroupSize ?? null);
        if (!prefs.budgetUnlimited && prefs.defaultBudget) {
          setBudgetPreset(prefs.defaultBudget);
        } else if (prefs.budgetUnlimited) {
          setBudgetPreset(null);
        }
      })
      .catch(() => {
        // fall back to legacy localStorage
        try {
          const raw = localStorage.getItem(`foodchain_food_prefs_${user.id}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            setDietary(parsed.dietary ?? []);
            setCuisines(parsed.cuisines ?? []);
          }
        } catch { /* ignore */ }
      });
  }, [user?.id]);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const addDisliked = () => {
    const trimmed = dislikedInput.trim().toLowerCase();
    if (trimmed && !disliked.includes(trimmed)) setDisliked(prev => [...prev, trimmed]);
    setDislikedInput('');
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save profile fields
      const profilePayload: Parameters<typeof updateProfile>[0] = {};
      if (nameInput.trim() && nameInput !== user?.name) {
        profilePayload.name = nameInput.trim();
      }
      let addressChanged = false;
      if (addressInput.trim() && addressInput !== user?.addressLine) {
        const coords = await geocodeAddressText(addressInput.trim());
        profilePayload.addressLine = addressInput.trim();
        if (coords) {
          profilePayload.latitude = coords.lat;
          profilePayload.longitude = coords.lng;
        }
        addressChanged = true;
      }
      if (Object.keys(profilePayload).length > 0) {
        await updateProfile(profilePayload);
        await refreshUser();
      }

      // Save preferences to v2 API
      const budgetUnlimited = budgetPreset === null || budgetPreset === undefined;
      const prefsPayload: SavePreferencesV2Request = {
        dietaryRestrictions: dietary,
        cuisinePreferences: cuisines,
        spiceLevel: spice,
        budgetUnlimited,
        ...(budgetUnlimited ? {} : { defaultBudget: budgetPreset ?? undefined }),
        healthGoal,
        foodAllergies: allergies,
        tastePreferences: taste,
        dislikedIngredients: disliked,
        appetiteSize: appetite,
        usualMealTimes: mealTimes,
        orderFrequency: frequency,
        typicalGroupSize: groupSize,
      };
      await saveUserPreferencesV2(prefsPayload);
      if (user?.id) syncToLocalStorage(user.id, prefsPayload);

      toast.success('Profile saved');
      if (addressChanged && onChangeBranch) {
        toast.info('Showing branches near your new address…', { duration: 2000 });
        setTimeout(onChangeBranch, 800);
      }
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
          {/* Account Info */}
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                <User className="w-5 h-5" />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--espresso)', opacity: 0.7 }}>Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-2"
                  style={{ borderColor: 'var(--espresso)', color: 'var(--espresso)', backgroundColor: 'var(--warm-white)' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--espresso)', opacity: 0.7 }}>Email</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: 'var(--espresso)', color: 'var(--espresso)', backgroundColor: 'var(--warm-white)', opacity: 0.5 }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Saved Address */}
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                <MapPin className="w-5 h-5" />
                Saved Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                Your saved address is used to find nearby branches automatically.
              </p>
              {user?.addressLine && (
                <div className="flex items-start gap-2 p-3 rounded-md" style={{ backgroundColor: 'var(--warm-white)' }}>
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sage-green)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--espresso)' }}>{user.addressLine}</p>
                </div>
              )}
              <label className="block text-sm mb-1.5" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                {user?.addressLine ? 'Update address' : 'Enter your delivery address'}
              </label>
              <LocationPicker
                value={addressInput}
                onChange={setAddressInput}
              />
            </CardContent>
          </Card>

          {/* Change Branch */}
          {onChangeBranch && (
            <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                  <UtensilsCrossed className="w-5 h-5" />
                  Your Branch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3" style={{ color: 'var(--espresso)', opacity: 0.6 }}>
                  Switch to a different branch or find one closer to you.
                </p>
                <div
                  className="flex items-start gap-2 p-3 rounded-lg mb-4 text-sm"
                  style={{ backgroundColor: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', color: 'var(--espresso)' }}
                >
                  <span className="mt-0.5">💡</span>
                  <p>If you updated your address above, scroll down and <strong>Save Profile</strong> first — the branch list will then show locations near your new address.</p>
                </div>
                <Button
                  onClick={onChangeBranch}
                  variant="outline"
                  className="w-full"
                  style={{ borderColor: 'var(--espresso)', color: 'var(--espresso)' }}
                >
                  Change Branch
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Food Preferences ──────────────────────────────────────────────── */}
          <Card className="border-[var(--espresso)]/10" style={{ backgroundColor: 'var(--white)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--espresso)' }}>
                <UtensilsCrossed className="w-5 h-5" />
                Food Preferences
              </CardTitle>
              <p className="text-sm" style={{ color: 'var(--espresso)', opacity: 0.55 }}>
                Helps us give you personalised recommendations.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Dietary & Health */}
              <div>
                <SectionLabel>Dietary restrictions</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(o => (
                    <Chip key={o.id} label={o.label} selected={dietary.includes(o.id)} onClick={() => toggle(dietary, setDietary, o.id)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Health goal</SectionLabel>
                <SingleSelectGrid
                  options={HEALTH_GOAL_OPTIONS}
                  value={healthGoal}
                  onChange={id => setHealthGoal(healthGoal === id ? null : id)}
                  cols={2}
                />
              </div>

              <div>
                <SectionLabel>Food allergies</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_OPTIONS.map(o => (
                    <Chip key={o.id} label={o.label} selected={allergies.includes(o.id)} onClick={() => toggle(allergies, setAllergies, o.id)} />
                  ))}
                </div>
              </div>

              <div className="border-t" style={{ borderColor: 'color-mix(in srgb, var(--espresso) 8%, transparent)' }} />

              {/* Taste & Flavour */}
              <div>
                <SectionLabel>Favourite cuisines</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map(o => (
                    <Chip key={o.id} label={o.label} selected={cuisines.includes(o.id)} onClick={() => toggle(cuisines, setCuisines, o.id)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Spice tolerance</SectionLabel>
                <div className="flex gap-2">
                  {SPICE_OPTIONS.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSpice(spice === o.id ? null : o.id)}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-colors"
                      style={{
                        backgroundColor: spice === o.id ? 'var(--espresso)' : 'transparent',
                        borderColor: spice === o.id ? 'var(--espresso)' : 'color-mix(in srgb, var(--espresso) 15%, transparent)',
                      }}
                    >
                      <span className="text-lg">{o.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight text-center" style={{ color: spice === o.id ? 'var(--warm-white)' : 'var(--espresso)' }}>
                        {o.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Taste preferences</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {TASTE_OPTIONS.map(o => (
                    <Chip key={o.id} label={o.label} selected={taste.includes(o.id)} onClick={() => toggle(taste, setTaste, o.id)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Disliked ingredients</SectionLabel>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={dislikedInput}
                    onChange={e => setDislikedInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDisliked(); } }}
                    placeholder="e.g. liver, olives…"
                    className="flex-1 px-3 py-2 rounded-xl text-sm border-2 outline-none"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'color-mix(in srgb, var(--espresso) 20%, transparent)',
                      color: 'var(--espresso)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={addDisliked}
                    className="px-3 py-2 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
                  >
                    Add
                  </button>
                </div>
                {disliked.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {disliked.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setDisliked(prev => prev.filter(x => x !== item))}
                        className="px-3 py-1 rounded-full text-sm border-2 flex items-center gap-1"
                        style={{ borderColor: 'color-mix(in srgb, var(--espresso) 25%, transparent)', color: 'var(--espresso)' }}
                      >
                        {item}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t" style={{ borderColor: 'color-mix(in srgb, var(--espresso) 8%, transparent)' }} />

              {/* Eating Habits */}
              <div>
                <SectionLabel>Appetite size</SectionLabel>
                <SingleSelectGrid
                  options={APPETITE_OPTIONS}
                  value={appetite}
                  onChange={id => setAppetite(appetite === id ? null : id)}
                  cols={3}
                />
              </div>

              <div>
                <SectionLabel>Usual meal times</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {MEAL_TIME_OPTIONS.map(o => (
                    <Chip key={o.id} label={o.label} selected={mealTimes.includes(o.id)} onClick={() => toggle(mealTimes, setMealTimes, o.id)} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>How often do you order?</SectionLabel>
                <SingleSelectGrid
                  options={ORDER_FREQUENCY_OPTIONS}
                  value={frequency}
                  onChange={id => setFrequency(frequency === id ? null : id)}
                  cols={2}
                />
              </div>

              <div>
                <SectionLabel>Typical group size</SectionLabel>
                <SingleSelectGrid
                  options={GROUP_SIZE_OPTIONS}
                  value={groupSize}
                  onChange={id => setGroupSize(groupSize === id ? null : id)}
                  cols={2}
                />
              </div>

              <div>
                <SectionLabel>Typical budget per meal</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_PRESETS.map(p => {
                    const isSelected = budgetPreset === p.value;
                    return (
                      <button
                        key={String(p.value)}
                        type="button"
                        onClick={() => setBudgetPreset(p.value)}
                        className="py-2.5 px-3 rounded-xl text-sm font-medium border-2 text-left transition-colors"
                        style={{
                          backgroundColor: isSelected ? 'color-mix(in srgb, var(--golden-amber) 15%, transparent)' : 'transparent',
                          borderColor: isSelected ? 'var(--golden-amber)' : 'color-mix(in srgb, var(--espresso) 15%, transparent)',
                          color: 'var(--espresso)',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
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
