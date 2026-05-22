import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ShoppingCart, RefreshCw, RotateCcw, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import {
  getFoodSuggestions,
  type FoodSuggestionRequest,
  type ComboSuggestion,
  type AiRecommendationResponse,
} from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoodPreferences {
  dietary: string[];
  cuisines: string[];
  spice: string | null;
}

type Step = 'welcome' | 'hunger' | 'budget' | 'mood' | 'loading' | 'results' | 'error';

interface Answers {
  hunger: string | null;
  budgetCustom: string;
  budgetPreset: number | null;
  moods: string[];
}

interface AddToCartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface HelpMeChooseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  userName?: string;
  userId?: string;
  onAddToCart: (item: AddToCartItem, quantity: number) => void;
  onGoToCart: () => void;
  onBrowseMenu: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_STEPS: Step[] = ['hunger', 'budget', 'mood'];

const HUNGER_OPTIONS = [
  { id: 'light', label: 'Light snack', emoji: '🍪', appetite: 'light' as const },
  { id: 'moderate', label: 'Moderately hungry', emoji: '🍽️', appetite: 'moderate' as const },
  { id: 'very', label: 'Very hungry', emoji: '🍖', appetite: 'heavy' as const },
];

const BUDGET_PRESETS = [
  { label: 'Under ₦5,000', value: 4999 },
  { label: '₦5,000–10,000', value: 10000 },
  { label: '₦10,000–15,000', value: 15000 },
  { label: '₦15,000+', value: 20000 },
];

const MOOD_OPTIONS = [
  { id: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { id: 'sweet', label: 'Sweet', emoji: '🍬' },
  { id: 'savory', label: 'Savory', emoji: '🧀' },
  { id: 'comfort', label: 'Comfort food', emoji: '🍲' },
];

const DEFAULT_ANSWERS: Answers = {
  hunger: null,
  budgetCustom: '',
  budgetPreset: null,
  moods: [],
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= breakpoint,
  );
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [breakpoint]);
  return isDesktop;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSavedPreferences(userId?: string): FoodPreferences | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`foodchain_food_prefs_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildRequest(
  answers: Answers,
  branchId: string,
  branchName: string,
  savedPrefs: FoodPreferences | null,
): FoodSuggestionRequest {
  const hungerOpt = HUNGER_OPTIONS.find((o) => o.id === answers.hunger);
  const appetite = hungerOpt?.appetite ?? 'heavy';

  const isUnlimitedPreset = answers.budgetPreset === 20000;
  const hasCustomBudget = answers.budgetCustom !== '';
  const hasPresetBudget = answers.budgetPreset !== null && !isUnlimitedPreset;
  const skipped = !hasCustomBudget && !hasPresetBudget && !isUnlimitedPreset;

  const budget = hasCustomBudget
    ? parseFloat(answers.budgetCustom)
    : hasPresetBudget
    ? answers.budgetPreset!
    : undefined;
  const budgetUnlimited = isUnlimitedPreset || skipped;

  const dietaryRestrictions = (savedPrefs?.dietary ?? []).filter(
    (d) => d !== 'no_restrictions' && d.toLowerCase() !== 'no restrictions',
  );

  const cuisinePreferences = (savedPrefs?.cuisines ?? []).filter(
    (c) => c.toLowerCase() !== 'any',
  );

  const spiceLower = savedPrefs?.spice?.toLowerCase();
  const spiceLevel =
    spiceLower === 'mild' ? 'spice_mild'
    : spiceLower === 'medium' ? 'spice_medium'
    : spiceLower === 'spicy' ? 'spice_hot'
    : null;

  const moodMap: Record<string, string> = {
    spicy: 'spicy',
    sweet: 'sweet',
    savory: 'savory',
    comfort: 'comfort_food',
  };
  const moods = answers.moods.map((m) => moodMap[m]).filter(Boolean);

  return {
    branchId,
    branchName,
    appetite,
    peopleCount: 1,
    ...(budget !== undefined && { budget }),
    ...(budgetUnlimited && { budgetUnlimited: true }),
    ...(dietaryRestrictions.length > 0 && { dietaryRestrictions }),
    ...(cuisinePreferences.length > 0 && { cuisinePreferences }),
    ...(spiceLevel && { spiceLevel }),
    ...(moods.length > 0 && { moods }),
    limit: 5,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          animate={{
            width: i === current ? 20 : 6,
            height: 6,
            backgroundColor:
              i === current
                ? 'var(--golden-amber)'
                : 'color-mix(in srgb, var(--espresso) 18%, transparent)',
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function OptionCard({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji?: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-colors"
      style={{
        backgroundColor: selected
          ? 'color-mix(in srgb, var(--espresso) 6%, transparent)'
          : 'var(--white)',
        borderColor: selected
          ? 'var(--espresso)'
          : 'color-mix(in srgb, var(--espresso) 12%, transparent)',
      }}
    >
      {emoji && <span className="text-xl leading-none shrink-0 select-none">{emoji}</span>}
      <span className="flex-1 text-base font-medium" style={{ color: 'var(--espresso)' }}>
        {label}
      </span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--espresso)' }}
        >
          <span className="text-[10px] font-bold" style={{ color: 'var(--warm-white)' }}>
            ✓
          </span>
        </motion.div>
      )}
    </motion.button>
  );
}

function ComboResultCard({
  combo,
  onAddCombo,
  onAddToCart,
}: {
  combo: ComboSuggestion;
  onAddCombo: (combo: ComboSuggestion) => void;
  onAddToCart: (item: AddToCartItem, qty: number) => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddCombo(combo);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className="p-3.5 rounded-xl border"
      style={{
        borderColor: 'color-mix(in srgb, var(--espresso) 10%, transparent)',
        backgroundColor: 'var(--white)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm" style={{ color: 'var(--espresso)' }}>
          {combo.comboName}
        </h4>
        <span className="font-bold text-sm shrink-0" style={{ color: 'var(--golden-amber)' }}>
          ₦{combo.totalPrice.toLocaleString()}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {combo.items.map((item) => (
          <div
            key={item.menuItemId}
            className="flex items-center justify-between gap-2 text-xs px-2 py-1 rounded-lg"
            style={{ backgroundColor: 'color-mix(in srgb, var(--espresso) 4%, transparent)' }}
          >
            <span className="truncate font-medium" style={{ color: 'var(--espresso)' }}>
              {item.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span style={{ color: 'var(--golden-amber)' }}>₦{item.price.toLocaleString()}</span>
              <button
                className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
                onClick={() =>
                  onAddToCart(
                    {
                      id: item.menuItemId,
                      name: item.name,
                      description: '',
                      price: item.price,
                      category: '',
                      available: true,
                    },
                    1,
                  )
                }
              >
                <ShoppingCart className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {combo.reason && (
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--charcoal)', opacity: 0.6 }}>
          {combo.reason}
        </p>
      )}

      <button
        onClick={handleAdd}
        className="w-full h-9 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
        style={{
          backgroundColor: added ? 'var(--sage-green)' : 'var(--espresso)',
          color: 'var(--warm-white)',
        }}
      >
        {added ? (
          <>✓ Added!</>
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5" />
            Add Combo
          </>
        )}
      </button>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: 'var(--golden-amber)' }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HelpMeChooseSheet({
  isOpen,
  onClose,
  branchId,
  branchName,
  userName,
  userId,
  onAddToCart,
  onGoToCart,
  onBrowseMenu,
}: HelpMeChooseSheetProps) {
  const isDesktop = useIsDesktop();
  const [step, setStep] = useState<Step>('welcome');
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [result, setResult] = useState<AiRecommendationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState<FoodPreferences | null>(null);

  const qIdx = QUESTION_STEPS.indexOf(step);
  const isQuestionStep = qIdx !== -1;
  const firstName = userName?.split(' ')[0] ?? '';

  useEffect(() => {
    if (isOpen) {
      setSavedPrefs(loadSavedPreferences(userId));
    }
  }, [isOpen, userId]);

  const goTo = (next: Step, dir: 1 | -1 = 1) => {
    setDirection(dir);
    setStep(next);
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('foodchain_help_me_choose_dismissed', 'true');
    }
    onClose();
  };

  const handleBrowseMenu = () => {
    onClose();
    onBrowseMenu();
  };

  const handleBack = () => {
    if (qIdx <= 0) goTo('welcome', -1);
    else goTo(QUESTION_STEPS[qIdx - 1], -1);
  };

  const handleNext = () => {
    if (qIdx >= QUESTION_STEPS.length - 1) submitAnswers();
    else goTo(QUESTION_STEPS[qIdx + 1]);
  };

  const handleStartOver = () => {
    setAnswers(DEFAULT_ANSWERS);
    setResult(null);
    setErrorMsg('');
    goTo('welcome');
  };

  const submitAnswers = async () => {
    goTo('loading');
    setErrorMsg('');
    setResult(null);
    try {
      const req = buildRequest(answers, branchId, branchName, savedPrefs);
      const res = await getFoodSuggestions(req);
      setResult(res);
      if (res.readyForSuggestions && res.suggestions.length > 0) {
        goTo('results');
      } else {
        setErrorMsg(
          res.suggestions.length === 0
            ? 'No items matched your preferences at this branch. Try adjusting your choices or browse the full menu.'
            : res.message || 'No matches found. Try adjusting your choices.',
        );
        goTo('error');
      }
    } catch {
      setErrorMsg("Couldn't connect right now. Check your connection and try again.");
      goTo('error');
    }
  };

  const handleAddAll = () => {
    if (!result?.suggestions?.length) return;
    result.suggestions.forEach((combo) =>
      combo.items.forEach((item) =>
        onAddToCart(
          {
            id: item.menuItemId,
            name: item.name,
            description: '',
            price: item.price,
            category: '',
            available: true,
          },
          1,
        ),
      ),
    );
    toast.success(
      `Added ${result.suggestions.length} combo${result.suggestions.length > 1 ? 's' : ''} to cart`,
    );
  };

  const handleHungerSelect = (id: string) => {
    setAnswers((a) => ({ ...a, hunger: id }));
    setTimeout(() => goTo('budget'), 280);
  };

  const toggleMood = (id: string) => {
    setAnswers((a) => ({
      ...a,
      moods: a.moods.includes(id) ? a.moods.filter((m) => m !== id) : [...a.moods, id],
    }));
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  // ── Step content ──────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center text-center px-2 py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl select-none"
              style={{ backgroundColor: 'color-mix(in srgb, var(--golden-amber) 15%, transparent)' }}
            >
              🍽️
            </div>
            {firstName ? (
              <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--espresso)' }}>
                Hello, {firstName}! 👋
              </h2>
            ) : (
              <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--espresso)' }}>
                Not sure what to eat?
              </h2>
            )}
            <p className="text-sm mb-1" style={{ color: 'var(--espresso)', opacity: 0.65 }}>
              Answer 3 quick questions and we'll suggest the perfect meal from{' '}
              <span className="font-semibold">{branchName}</span>.
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--espresso)', opacity: 0.4 }}>
              Takes under 30 seconds.
            </p>
            <button
              onClick={() => goTo('hunger')}
              className="w-full py-3.5 rounded-xl text-base font-semibold mb-3"
              style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
            >
              Help Me Choose →
            </button>
            <button
              onClick={handleBrowseMenu}
              className="w-full py-2.5 rounded-xl text-sm font-medium border"
              style={{
                borderColor: 'color-mix(in srgb, var(--espresso) 15%, transparent)',
                color: 'var(--espresso)',
                opacity: 0.7,
              }}
            >
              Browse Menu
            </button>
            <label
              className="flex items-center gap-2 mt-5 text-xs cursor-pointer select-none"
              style={{ color: 'var(--espresso)', opacity: 0.4 }}
            >
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded-sm"
              />
              Don't show this again
            </label>
          </div>
        );

      case 'hunger':
        return (
          <div className="space-y-2.5">
            {HUNGER_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                emoji={opt.emoji}
                label={opt.label}
                selected={answers.hunger === opt.id}
                onClick={() => handleHungerSelect(opt.id)}
              />
            ))}
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    setAnswers((a) => ({
                      ...a,
                      budgetPreset: a.budgetPreset === preset.value ? null : preset.value,
                      budgetCustom: '',
                    }))
                  }
                  className="px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all text-center"
                  style={{
                    backgroundColor:
                      answers.budgetPreset === preset.value && !answers.budgetCustom
                        ? 'var(--espresso)'
                        : 'var(--white)',
                    color:
                      answers.budgetPreset === preset.value && !answers.budgetCustom
                        ? 'var(--warm-white)'
                        : 'var(--espresso)',
                    borderColor:
                      answers.budgetPreset === preset.value && !answers.budgetCustom
                        ? 'var(--espresso)'
                        : 'color-mix(in srgb, var(--espresso) 12%, transparent)',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--charcoal)', opacity: 0.5 }}>
                Have a custom budget? Enter here:
              </p>
              <div
                className="flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-colors"
                style={{
                  borderColor: answers.budgetCustom
                    ? 'var(--golden-amber)'
                    : 'color-mix(in srgb, var(--espresso) 12%, transparent)',
                  backgroundColor: answers.budgetCustom
                    ? 'color-mix(in srgb, var(--golden-amber) 6%, transparent)'
                    : 'var(--white)',
                }}
              >
                <span
                  className="text-base font-medium"
                  style={{ color: 'var(--espresso)', opacity: 0.5 }}
                >
                  ₦
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 8,000"
                  value={answers.budgetCustom}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, budgetCustom: e.target.value, budgetPreset: null }))
                  }
                  className="flex-1 bg-transparent text-base outline-none"
                  style={{ color: 'var(--espresso)' }}
                />
              </div>
            </div>
          </div>
        );

      case 'mood':
        return (
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((opt) => (
              <motion.button
                key={opt.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleMood(opt.id)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: answers.moods.includes(opt.id)
                    ? 'color-mix(in srgb, var(--espresso) 6%, transparent)'
                    : 'var(--white)',
                  borderColor: answers.moods.includes(opt.id)
                    ? 'var(--espresso)'
                    : 'color-mix(in srgb, var(--espresso) 12%, transparent)',
                  color: 'var(--espresso)',
                }}
              >
                <span className="text-xl select-none">{opt.emoji}</span>
                {opt.label}
                <AnimatePresence>
                  {answers.moods.includes(opt.id) && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        );

      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl select-none"
            >
              ✨
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--espresso)' }}>
                Finding the perfect meal for you…
              </p>
              <TypingDots />
            </div>
            <p className="text-xs" style={{ color: 'var(--charcoal)', opacity: 0.4 }}>
              Checking {branchName}'s menu
            </p>
          </div>
        );

      case 'results':
        if (!result?.suggestions?.length) return null;
        return (
          <div className="space-y-2.5">
            {result.message && (
              <p className="text-xs font-medium px-0.5" style={{ color: 'var(--espresso)', opacity: 0.7 }}>
                {result.message}
              </p>
            )}
            {result.estimatedTotalCost > 0 && (
              <p className="text-xs px-0.5" style={{ color: 'var(--charcoal)', opacity: 0.5 }}>
                Est. total: ₦{result.estimatedTotalCost.toLocaleString()}
              </p>
            )}
            {result.suggestions.map((combo, i) => (
              <motion.div
                key={`${combo.comboName}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <ComboResultCard
                  combo={combo}
                  onAddCombo={(c) => {
                    c.items.forEach((item) =>
                      onAddToCart(
                        {
                          id: item.menuItemId,
                          name: item.name,
                          description: '',
                          price: item.price,
                          category: '',
                          available: true,
                        },
                        1,
                      ),
                    );
                    toast.success(`Added "${c.comboName}" to cart`);
                  }}
                  onAddToCart={onAddToCart}
                />
              </motion.div>
            ))}
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center px-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--burnt-orange) 12%, transparent)' }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: 'var(--burnt-orange)' }} />
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--espresso)' }}>
                No matches found
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--charcoal)', opacity: 0.6 }}>
                {errorMsg || 'Try adjusting your choices or browse the full menu.'}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Footer ────────────────────────────────────────────────────────────────────

  const renderFooter = () => {
    if (step === 'loading' || step === 'welcome') return null;

    if (step === 'results') {
      return (
        <div className="space-y-2">
          <button
            onClick={handleAddAll}
            className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
          >
            <ShoppingCart className="w-4 h-4" />
            Add All to Cart
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onGoToCart}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
              style={{
                borderColor: 'color-mix(in srgb, var(--espresso) 15%, transparent)',
                color: 'var(--espresso)',
              }}
            >
              View Cart
            </button>
            <button
              onClick={handleBrowseMenu}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
              style={{
                borderColor: 'color-mix(in srgb, var(--espresso) 15%, transparent)',
                color: 'var(--espresso)',
              }}
            >
              Browse Menu
            </button>
          </div>
          <button
            onClick={handleStartOver}
            className="w-full py-2 text-xs flex items-center justify-center gap-1.5"
            style={{ color: 'var(--espresso)', opacity: 0.45 }}
          >
            <RotateCcw className="w-3 h-3" />
            Try different preferences
          </button>
        </div>
      );
    }

    if (step === 'error') {
      return (
        <div className="space-y-2">
          <button
            onClick={handleBrowseMenu}
            className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Browse Full Menu
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartOver}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
              style={{
                borderColor: 'color-mix(in srgb, var(--espresso) 15%, transparent)',
                color: 'var(--espresso)',
              }}
            >
              Start Over
            </button>
            <button
              onClick={submitAnswers}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (!isQuestionStep) return null;

    const isLastStep = qIdx === QUESTION_STEPS.length - 1;
    const canProceed = step === 'hunger' ? answers.hunger !== null : true;

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm"
          style={{ color: 'var(--espresso)', opacity: 0.5 }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex-1" />
        {step !== 'hunger' && (
          <button
            onClick={handleNext}
            className="px-3 py-2.5 text-sm"
            style={{ color: 'var(--espresso)', opacity: 0.4 }}
          >
            Skip
          </button>
        )}
        <button
          onClick={isLastStep ? submitAnswers : handleNext}
          disabled={!canProceed}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: canProceed
              ? 'var(--golden-amber)'
              : 'color-mix(in srgb, var(--espresso) 12%, transparent)',
            color: canProceed ? 'var(--charcoal)' : 'var(--espresso)',
            opacity: canProceed ? 1 : 0.6,
          }}
        >
          {isLastStep ? 'Find My Match →' : 'Next →'}
        </button>
      </div>
    );
  };

  // ── Shared inner body ─────────────────────────────────────────────────────────

  const footer = renderFooter();

  const innerBody = (
    <>
      {/* Handle bar — mobile only */}
      {!isDesktop && (
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'color-mix(in srgb, var(--espresso) 15%, transparent)' }}
          />
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0 border-b"
        style={{ borderColor: 'color-mix(in srgb, var(--espresso) 8%, transparent)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--espresso)' }}>
          {step === 'results'
            ? `${result?.suggestions?.length ?? 0} suggestion${(result?.suggestions?.length ?? 0) !== 1 ? 's' : ''} found`
            : 'Help Me Choose'}
        </span>
        <div className="flex items-center gap-3">
          {isQuestionStep && (
            <span
              className="text-xs tabular-nums"
              style={{ color: 'var(--espresso)', opacity: 0.35 }}
            >
              {qIdx + 1} / {QUESTION_STEPS.length}
            </span>
          )}
          {step !== 'loading' && (
            <button
              onClick={handleClose}
              className="p-1 rounded-lg transition-opacity opacity-40 hover:opacity-80"
              style={{ color: 'var(--espresso)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress dots */}
      {isQuestionStep && (
        <div className="shrink-0 px-5">
          <ProgressDots current={qIdx} total={QUESTION_STEPS.length} />
        </div>
      )}

      {/* Question label */}
      {isQuestionStep && (
        <div className="px-5 pt-2 pb-3 shrink-0">
          <h3 className="text-lg font-bold" style={{ color: 'var(--espresso)' }}>
            {step === 'hunger' && 'How hungry are you?'}
            {step === 'budget' && "What's your budget?"}
            {step === 'mood' && 'What are you in the mood for?'}
          </h3>
          {step === 'budget' && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--charcoal)', opacity: 0.5 }}>
              Optional — skip to see all options
            </p>
          )}
          {step === 'mood' && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--charcoal)', opacity: 0.5 }}>
              Pick as many as you like, or skip
            </p>
          )}
        </div>
      )}

      {/* Animated content */}
      <div className="flex-1 overflow-y-auto px-5 pb-2" style={{ minHeight: 180 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      {footer && (
        <div
          className="px-5 py-4 border-t shrink-0"
          style={{ borderColor: 'color-mix(in srgb, var(--espresso) 8%, transparent)' }}
        >
          {footer}
        </div>
      )}

      {/* Safe area — mobile only */}
      {!isDesktop && (
        <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      )}
    </>
  );

  // ── Responsive wrapper ────────────────────────────────────────────────────────

  const onOpenChange = (open: boolean) => {
    if (!open && step !== 'loading') handleClose();
  };

  if (isDesktop) {
    return (
      <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <DialogPrimitive.Content
            className="fixed left-1/2 top-1/2 z-50 w-full flex flex-col rounded-2xl outline-none overflow-hidden"
            style={{
              transform: 'translate(-50%, -50%)',
              maxWidth: 440,
              maxHeight: '85vh',
              backgroundColor: 'var(--warm-white)',
            }}
          >
            <DialogPrimitive.Title className="sr-only">Help Me Choose</DialogPrimitive.Title>
            {innerBody}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <DrawerPrimitive.Root open={isOpen} onOpenChange={onOpenChange} direction="bottom">
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl outline-none"
          style={{
            backgroundColor: 'var(--warm-white)',
            maxHeight: '88vh',
          }}
        >
          {innerBody}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
