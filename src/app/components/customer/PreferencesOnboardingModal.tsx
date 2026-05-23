import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { saveUserPreferencesV2, type SavePreferencesV2Request } from '@/services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const DIETARY_OPTIONS = [
  { id: 'vegetarian',   label: 'Vegetarian' },
  { id: 'vegan',        label: 'Vegan' },
  { id: 'halal',        label: 'Halal' },
  { id: 'gluten_free',  label: 'Gluten Free' },
  { id: 'dairy_free',   label: 'Dairy Free' },
  { id: 'nut_free',     label: 'Nut Free' },
  { id: 'no_pork',      label: 'No Pork' },
  { id: 'no_seafood',   label: 'No Seafood' },
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
  { id: 'spice_none',      label: 'None',       emoji: '💧' },
  { id: 'spice_mild',      label: 'Mild',        emoji: '🌿' },
  { id: 'spice_medium',    label: 'Medium',      emoji: '🌶️' },
  { id: 'spice_hot',       label: 'Hot',         emoji: '🔥' },
  { id: 'spice_extra_hot', label: 'Extra Hot',   emoji: '🌋' },
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
  { id: 'daily',            label: 'Daily' },
  { id: 'few_times_week',   label: 'Few times/week' },
  { id: 'weekends_only',    label: 'Weekends only' },
  { id: 'occasionally',     label: 'Occasionally' },
];

const GROUP_SIZE_OPTIONS = [
  { id: 'solo',        label: 'Solo',         emoji: '🧍' },
  { id: 'two_people',  label: 'Couple',        emoji: '👫' },
  { id: 'family',      label: 'Family',        emoji: '👨‍👩‍👧' },
  { id: 'large_group', label: 'Large group',   emoji: '👥' },
];

const BUDGET_PRESETS = [
  { label: 'Under ₦5k',    value: 4999 },
  { label: '₦5k – ₦10k',  value: 10000 },
  { label: '₦10k – ₦20k', value: 20000 },
  { label: 'No limit',     value: null },
];

const STEPS = ['Dietary & Health', 'Taste & Flavour', 'Eating Habits'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function syncToLocalStorage(userId: string | undefined, prefs: SavePreferencesV2Request) {
  if (!userId) return;
  const spiceMap: Record<string, string> = {
    spice_mild: 'mild',
    spice_medium: 'medium',
    spice_hot: 'spicy',
    spice_extra_hot: 'spicy',
    spice_none: 'mild',
  };
  const legacy = {
    dietary: prefs.dietaryRestrictions,
    cuisines: prefs.cuisinePreferences,
    spice: prefs.spiceLevel ? (spiceMap[prefs.spiceLevel] ?? null) : null,
  };
  localStorage.setItem(`foodchain_food_prefs_${userId}`, JSON.stringify(legacy));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors"
      style={{
        backgroundColor: selected ? 'var(--espresso)' : 'transparent',
        borderColor: selected ? 'var(--espresso)' : 'color-mix(in srgb, var(--espresso) 20%, transparent)',
        color: selected ? 'var(--warm-white)' : 'var(--espresso)',
      }}
    >
      {label}
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'color-mix(in srgb, var(--espresso) 45%, transparent)' }}>
      {children}
    </p>
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
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSaved: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PreferencesOnboardingModal({ isOpen, onClose, userId, onSaved }: Props) {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1 — Dietary & Health
  const [dietary, setDietary]           = useState<string[]>([]);
  const [healthGoal, setHealthGoal]     = useState<string | null>(null);
  const [allergies, setAllergies]       = useState<string[]>([]);

  // Step 2 — Taste & Flavour
  const [cuisines, setCuisines]               = useState<string[]>([]);
  const [spice, setSpice]                     = useState<string | null>(null);
  const [taste, setTaste]                     = useState<string[]>([]);
  const [dislikedInput, setDislikedInput]     = useState('');
  const [disliked, setDisliked]               = useState<string[]>([]);

  // Step 3 — Eating Habits
  const [appetite, setAppetite]         = useState<string | null>(null);
  const [mealTimes, setMealTimes]       = useState<string[]>([]);
  const [frequency, setFrequency]       = useState<string | null>(null);
  const [groupSize, setGroupSize]       = useState<string | null>(null);
  const [budgetPreset, setBudgetPreset] = useState<number | null | undefined>(undefined);

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const addDisliked = () => {
    const trimmed = dislikedInput.trim();
    if (trimmed && !disliked.includes(trimmed.toLowerCase())) {
      setDisliked(prev => [...prev, trimmed.toLowerCase()]);
    }
    setDislikedInput('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const budgetUnlimited = budgetPreset === null || budgetPreset === undefined;
    const payload: SavePreferencesV2Request = {
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

    try {
      await saveUserPreferencesV2(payload);
      syncToLocalStorage(userId, payload);
      toast.success('Preferences saved!', { description: "We'll use these to personalise your recommendations." });
      onSaved();
    } catch {
      toast.error('Could not save preferences', { description: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

        <DialogPrimitive.Content
          className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl outline-none overflow-hidden"
          style={{ backgroundColor: 'var(--warm-white)' }}
        >
          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--espresso) 18%, transparent)' }} />
          </div>

          <div className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-4 pb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--espresso)' }}>
                  Personalise FoodChain
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'color-mix(in srgb, var(--espresso) 55%, transparent)' }}>
                  {STEPS[step]}
                </p>
              </div>
              <DialogPrimitive.Close
                className="p-1.5 rounded-full transition-colors hover:bg-black/5 shrink-0"
                style={{ color: 'var(--espresso)' }}
              >
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            </div>

            {/* Step indicators */}
            <div className="flex gap-1.5 px-6 pb-4">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{ backgroundColor: i <= step ? 'var(--espresso)' : 'color-mix(in srgb, var(--espresso) 15%, transparent)' }}
                />
              ))}
            </div>

            <div className="px-6 pb-6 space-y-6">
              {/* ── Step 1: Dietary & Health ── */}
              {step === 0 && (
                <>
                  <div>
                    <SectionHeading>Dietary restrictions</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map(o => (
                        <Chip key={o.id} label={o.label} selected={dietary.includes(o.id)} onClick={() => toggleItem(dietary, setDietary, o.id)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionHeading>Health goal</SectionHeading>
                    <SingleSelectGrid
                      options={HEALTH_GOAL_OPTIONS}
                      value={healthGoal}
                      onChange={id => setHealthGoal(healthGoal === id ? null : id)}
                      cols={2}
                    />
                  </div>

                  <div>
                    <SectionHeading>Food allergies</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGY_OPTIONS.map(o => (
                        <Chip key={o.id} label={o.label} selected={allergies.includes(o.id)} onClick={() => toggleItem(allergies, setAllergies, o.id)} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 2: Taste & Flavour ── */}
              {step === 1 && (
                <>
                  <div>
                    <SectionHeading>Favourite cuisines</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map(o => (
                        <Chip key={o.id} label={o.label} selected={cuisines.includes(o.id)} onClick={() => toggleItem(cuisines, setCuisines, o.id)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionHeading>Spice tolerance</SectionHeading>
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
                    <SectionHeading>Taste preferences</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                      {TASTE_OPTIONS.map(o => (
                        <Chip key={o.id} label={o.label} selected={taste.includes(o.id)} onClick={() => toggleItem(taste, setTaste, o.id)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionHeading>Disliked ingredients</SectionHeading>
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
                            style={{
                              borderColor: 'color-mix(in srgb, var(--espresso) 25%, transparent)',
                              color: 'var(--espresso)',
                            }}
                          >
                            {item}
                            <X className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Step 3: Eating Habits ── */}
              {step === 2 && (
                <>
                  <div>
                    <SectionHeading>Appetite size</SectionHeading>
                    <SingleSelectGrid options={APPETITE_OPTIONS} value={appetite} onChange={id => setAppetite(appetite === id ? null : id)} cols={3} />
                  </div>

                  <div>
                    <SectionHeading>Usual meal times</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                      {MEAL_TIME_OPTIONS.map(o => (
                        <Chip key={o.id} label={o.label} selected={mealTimes.includes(o.id)} onClick={() => toggleItem(mealTimes, setMealTimes, o.id)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionHeading>How often do you order?</SectionHeading>
                    <SingleSelectGrid options={ORDER_FREQUENCY_OPTIONS} value={frequency} onChange={id => setFrequency(frequency === id ? null : id)} cols={2} />
                  </div>

                  <div>
                    <SectionHeading>Typical group size</SectionHeading>
                    <SingleSelectGrid options={GROUP_SIZE_OPTIONS} value={groupSize} onChange={id => setGroupSize(groupSize === id ? null : id)} cols={2} />
                  </div>

                  <div>
                    <SectionHeading>Typical budget per meal</SectionHeading>
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
                </>
              )}

              {/* Navigation */}
              <div className="space-y-2 pt-1">
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep(s => s + 1)}
                    className="w-full py-3.5 rounded-xl text-base font-bold transition-opacity hover:opacity-90 active:opacity-80 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-3.5 rounded-xl text-base font-bold transition-opacity hover:opacity-90 active:opacity-80 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Save Preferences
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                <div className="flex gap-2">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep(s => s - 1)}
                      className="flex-1 py-2.5 text-sm font-medium transition-opacity hover:opacity-70 flex items-center justify-center gap-1"
                      style={{ color: 'color-mix(in srgb, var(--espresso) 60%, transparent)' }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 text-sm transition-opacity hover:opacity-60"
                    style={{ color: 'color-mix(in srgb, var(--espresso) 45%, transparent)' }}
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
