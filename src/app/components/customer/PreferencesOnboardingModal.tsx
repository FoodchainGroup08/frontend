import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { saveUserPreferencesV2, type SavePreferencesV2Request } from '@/services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const DIETARY_OPTIONS = [
  { id: 'halal',            label: 'Halal' },
  { id: 'vegan',            label: 'Vegan' },
  { id: 'vegetarian',       label: 'Vegetarian' },
  { id: 'no_seafood',       label: 'No Seafood' },
  { id: 'low_carb',         label: 'Low Carb' },
  { id: 'high_protein',     label: 'High Protein' },
  { id: 'diabetic_friendly',label: 'Diabetic Friendly' },
  { id: 'weight_loss',      label: 'Weight Loss' },
];

const CUISINE_OPTIONS = [
  { id: 'nigerian',    label: '🇳🇬 Nigerian' },
  { id: 'continental', label: '🌍 Continental' },
  { id: 'asian',       label: '🥢 Asian' },
  { id: 'italian',     label: '🍝 Italian' },
  { id: 'fast_food',   label: '🍔 Fast Food' },
];

const SPICE_OPTIONS = [
  { id: 'spice_mild',   label: 'Mild',   emoji: '🌿' },
  { id: 'spice_medium', label: 'Medium', emoji: '🌶️' },
  { id: 'spice_hot',    label: 'Hot',    emoji: '🔥' },
];

const BUDGET_PRESETS = [
  { label: 'Under ₦5k',     value: 4999 },
  { label: '₦5k – ₦10k',   value: 10000 },
  { label: '₦10k – ₦20k',  value: 20000 },
  { label: 'No limit',      value: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function syncToLocalStorage(userId: string | undefined, prefs: SavePreferencesV2Request) {
  if (!userId) return;
  const spiceMap: Record<string, string> = {
    spice_mild: 'mild',
    spice_medium: 'medium',
    spice_hot: 'spicy',
  };
  const legacy = {
    dietary: prefs.dietaryRestrictions,
    cuisines: prefs.cuisinePreferences,
    spice: prefs.spiceLevel ? (spiceMap[prefs.spiceLevel] ?? null) : null,
  };
  localStorage.setItem(`foodchain_food_prefs_${userId}`, JSON.stringify(legacy));
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

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

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'color-mix(in srgb, var(--espresso) 45%, transparent)' }}>
      {children}
    </p>
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
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [spice, setSpice] = useState<string | null>(null);
  const [budgetPreset, setBudgetPreset] = useState<number | null | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
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
    };

    try {
      await saveUserPreferencesV2(payload);
      syncToLocalStorage(userId, payload);
      toast.success('Preferences saved!', { description: 'We\'ll use these to personalise your recommendations.' });
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
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

        {/* Panel */}
        <DialogPrimitive.Content
          className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl outline-none overflow-hidden"
          style={{ backgroundColor: 'var(--warm-white)' }}
        >
          {/* Drag handle on mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--espresso) 18%, transparent)' }} />
          </div>

          {/* Scrollable body */}
          <div className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-4 pb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--espresso)' }}>
                  Personalise FoodChain
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'color-mix(in srgb, var(--espresso) 55%, transparent)' }}>
                  Help us recommend meals you'll love
                </p>
              </div>
              <DialogPrimitive.Close
                className="p-1.5 rounded-full transition-colors hover:bg-black/5 shrink-0"
                style={{ color: 'var(--espresso)' }}
              >
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="px-6 pb-6 space-y-6">
              {/* Dietary restrictions */}
              <div>
                <SectionHeading>Dietary restrictions</SectionHeading>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(o => (
                    <Chip
                      key={o.id}
                      label={o.label}
                      selected={dietary.includes(o.id)}
                      onClick={() => toggleItem(dietary, setDietary, o.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Cuisine preferences */}
              <div>
                <SectionHeading>Favourite cuisines</SectionHeading>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map(o => (
                    <Chip
                      key={o.id}
                      label={o.label}
                      selected={cuisines.includes(o.id)}
                      onClick={() => toggleItem(cuisines, setCuisines, o.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Spice level */}
              <div>
                <SectionHeading>Spice tolerance</SectionHeading>
                <div className="flex gap-3">
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
                      <span className="text-xl">{o.emoji}</span>
                      <span className="text-xs font-medium" style={{ color: spice === o.id ? 'var(--warm-white)' : 'var(--espresso)' }}>
                        {o.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
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

              {/* CTA */}
              <div className="space-y-2 pt-1">
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
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-sm transition-opacity hover:opacity-60"
                  style={{ color: 'color-mix(in srgb, var(--espresso) 45%, transparent)' }}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
