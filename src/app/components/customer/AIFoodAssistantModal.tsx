import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Sparkles,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  getFoodSuggestions,
  type FoodSuggestionRequest,
  type FoodSuggestionItem,
  type FoodSuggestionResponse,
} from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | 'welcome'
  | 'hunger'
  | 'mood'
  | 'meal-type'
  | 'fulfillment'
  | 'budget'
  | 'dietary'
  | 'notes'
  | 'loading'
  | 'clarify'
  | 'results'
  | 'error';

interface WizardAnswers {
  hungerLevel: string | null;
  moods: string[];
  mealType: string | null;
  fulfillmentType: string | null;
  budget: string | null;
  dietaryPreferences: string[];
  notes: string;
}

interface AddToCartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface AIFoodAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  onAddToCart: (item: AddToCartItem, quantity: number) => void;
  onGoToCart: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_STEPS: Step[] = ['hunger', 'mood', 'meal-type', 'fulfillment', 'budget', 'dietary', 'notes'];

interface StepMeta {
  question: string;
  subtitle?: string;
  optional?: boolean;
}

const STEP_META: Partial<Record<Step, StepMeta>> = {
  hunger: {
    question: 'How hungry are you?',
    subtitle: 'This helps us pick the right portion size.',
  },
  mood: {
    question: 'What are you in the mood for?',
    subtitle: 'Pick as many as you like.',
    optional: true,
  },
  'meal-type': { question: 'What type of meal?', optional: true },
  fulfillment: { question: 'How will you receive your order?', optional: true },
  budget: { question: "What's your budget?", optional: true },
  dietary: {
    question: 'Any dietary preferences?',
    subtitle: 'Optional — skip if none apply.',
    optional: true,
  },
  notes: {
    question: 'Anything else we should know?',
    subtitle: 'Optional — e.g. "No seafood", "I love chicken"',
    optional: true,
  },
};

const HUNGER_OPTIONS = [
  { label: 'Light snack', emoji: '🍪' },
  { label: 'Moderate meal', emoji: '🍽️' },
  { label: 'Very hungry', emoji: '🍖' },
  { label: 'Family-sized', emoji: '👨‍👩‍👧‍👦' },
];

const MOOD_OPTIONS = [
  { label: 'Spicy', emoji: '🌶️' },
  { label: 'Sweet', emoji: '🍬' },
  { label: 'Savory', emoji: '🧀' },
  { label: 'Healthy', emoji: '🥗' },
  { label: 'Comfort food', emoji: '🍲' },
  { label: 'Surprise me', emoji: '✨' },
];

const MEAL_TYPE_OPTIONS = [
  { label: 'Breakfast', emoji: '🌅' },
  { label: 'Lunch', emoji: '☀️' },
  { label: 'Dinner', emoji: '🌙' },
  { label: 'Dessert', emoji: '🍮' },
  { label: 'Drinks', emoji: '🧋' },
];

const BUDGET_OPTIONS = [
  { label: 'Under ₦2,000', emoji: '💵' },
  { label: '₦2,000 – ₦5,000', emoji: '💸' },
  { label: '₦5,000 – ₦10,000', emoji: '💰' },
  { label: 'No limit', emoji: '🤑' },
];

const FULFILLMENT_OPTIONS = [
  { label: 'Dine-in', emoji: '🪑' },
  { label: 'Pickup', emoji: '🛍️' },
  { label: 'Delivery', emoji: '🚚' },
];

const DIETARY_OPTIONS = [
  { label: 'No restrictions', emoji: '✅' },
  { label: 'Halal', emoji: '☪️' },
  { label: 'Vegetarian', emoji: '🥦' },
  { label: 'Vegan', emoji: '🌱' },
  { label: 'Low Carb', emoji: '🥗' },
  { label: 'High Protein', emoji: '💪' },
  { label: 'Diabetic-Friendly', emoji: '🩺' },
  { label: 'Weight Loss', emoji: '⚖️' },
];

const DEFAULT_ANSWERS: WizardAnswers = {
  hungerLevel: null,
  moods: [],
  mealType: null,
  fulfillmentType: null,
  budget: null,
  dietaryPreferences: [],
  notes: '',
};

// ─── Answer → request mapper ──────────────────────────────────────────────────

function buildSuggestionRequest(
  answers: WizardAnswers,
  branchId: string,
  branchName: string
): FoodSuggestionRequest {
  const dietaryPrefs: string[] = [];

  const moodToPrefs: Record<string, string[]> = {
    Spicy: ['spicy'],
    Sweet: ['sweet'],
    Savory: ['savory'],
    Healthy: ['high protein', 'low sugar'],
    'Comfort food': [],
    'Surprise me': [],
  };
  answers.moods.forEach((m) => dietaryPrefs.push(...(moodToPrefs[m] ?? [])));

  answers.dietaryPreferences
    .filter((p) => p !== 'No restrictions')
    .forEach((p) => dietaryPrefs.push(p.toLowerCase().replace(/-/g, ' ')));

  if (answers.notes.trim()) dietaryPrefs.push(answers.notes.trim());

  const hungerMap: Record<string, { appetite: 'light' | 'heavy'; count: number }> = {
    'Light snack': { appetite: 'light', count: 1 },
    'Moderate meal': { appetite: 'heavy', count: 1 },
    'Very hungry': { appetite: 'heavy', count: 1 },
    'Family-sized': { appetite: 'heavy', count: 4 },
  };
  const { appetite, count } = hungerMap[answers.hungerLevel ?? 'Moderate meal'] ?? {
    appetite: 'heavy' as const,
    count: 1,
  };

  const budgetMap: Record<string, number | undefined> = {
    'Under ₦2,000': 2000,
    '₦2,000 – ₦5,000': 5000,
    '₦5,000 – ₦10,000': 10000,
    'No limit': undefined,
  };
  const budget = answers.budget ? budgetMap[answers.budget] : undefined;

  const mealTypeMap: Record<string, FoodSuggestionRequest['mealType']> = {
    Breakfast: 'breakfast',
    Lunch: 'lunch',
    Dinner: 'dinner',
    Dessert: 'dessert',
    Drinks: 'snack',
  };
  const mealType = answers.mealType ? mealTypeMap[answers.mealType] : undefined;

  const fulfillmentMap: Record<string, FoodSuggestionRequest['fulfillmentType']> = {
    'Dine-in': 'dine-in',
    Pickup: 'pickup',
    Delivery: 'delivery',
  };
  const fulfillmentType = answers.fulfillmentType
    ? fulfillmentMap[answers.fulfillmentType]
    : undefined;

  return {
    branchId,
    branchName,
    appetite,
    peopleCount: count,
    ...(budget !== undefined && { budget }),
    ...(mealType && { mealType }),
    ...(fulfillmentType && { fulfillmentType }),
    ...(dietaryPrefs.length > 0 && { dietaryPreferences: [...new Set(dietaryPrefs)] }),
    limit: 5,
  };
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className='flex items-center gap-1.5'>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className='w-2.5 h-2.5 rounded-full'
          style={{ backgroundColor: 'var(--foodchain-golden-amber)' }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

// ─── Option chip ──────────────────────────────────────────────────────────────

function OptionChip({
  label,
  emoji,
  selected,
  onClick,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left'
      style={{
        backgroundColor: selected ? 'var(--foodchain-espresso)' : 'transparent',
        color: selected ? 'var(--foodchain-warm-white)' : 'var(--foodchain-espresso)',
        borderColor: selected
          ? 'var(--foodchain-espresso)'
          : 'color-mix(in srgb, var(--foodchain-espresso) 18%, transparent)',
      }}
    >
      {emoji && <span className='text-base leading-none'>{emoji}</span>}
      <span className='flex-1'>{label}</span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className='text-xs ml-auto'
          style={{ color: 'var(--foodchain-golden-amber)' }}
        >
          ✓
        </motion.span>
      )}
    </button>
  );
}

// ─── Suggestion result card ───────────────────────────────────────────────────

function SuggestionCard({
  item,
  onAddToCart,
}: {
  item: FoodSuggestionItem;
  onAddToCart: (item: AddToCartItem, qty: number) => void;
}) {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(
      {
        id: item.menuItemId,
        name: item.menuItemName,
        description: '',
        price: item.price,
        category: '',
        available: true,
      },
      1
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div
      className='flex items-start gap-3 p-3 rounded-xl border'
      style={{
        borderColor: 'color-mix(in srgb, var(--foodchain-espresso) 10%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--foodchain-espresso) 2%, transparent)',
      }}
    >
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between gap-2'>
          <h4
            className='font-semibold text-sm leading-snug'
            style={{ color: 'var(--foodchain-espresso)' }}
          >
            {item.menuItemName}
          </h4>
          <span
            className='text-sm font-bold shrink-0'
            style={{ color: 'var(--foodchain-golden-amber)' }}
          >
            ₦{item.price.toLocaleString()}
          </span>
        </div>

        {item.reason && (
          <div className='flex items-start gap-1.5 mt-1.5'>
            <Sparkles
              className='w-3 h-3 mt-0.5 shrink-0'
              style={{ color: 'var(--foodchain-golden-amber)' }}
            />
            <p
              className='text-xs leading-relaxed'
              style={{ color: 'var(--foodchain-charcoal)', opacity: 0.7 }}
            >
              {item.reason}
            </p>
          </div>
        )}

        {item.optionalAddOns?.length > 0 && (
          <div className='flex flex-wrap gap-1 mt-2'>
            {item.optionalAddOns.slice(0, 2).map((addon) => (
              <Badge key={addon} variant='secondary' className='text-xs py-0'>
                {addon}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleAdd}
        className='shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors'
        style={{
          backgroundColor: justAdded ? 'var(--foodchain-sage-green)' : 'var(--foodchain-espresso)',
          color: 'var(--foodchain-warm-white)',
        }}
        title={justAdded ? 'Added!' : 'Add to cart'}
      >
        {justAdded ? (
          <span className='text-xs font-bold'>✓</span>
        ) : (
          <ShoppingCart className='w-3.5 h-3.5' />
        )}
      </button>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AIFoodAssistantModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  onAddToCart,
  onGoToCart,
}: AIFoodAssistantModalProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [answers, setAnswers] = useState<WizardAnswers>(DEFAULT_ANSWERS);
  const [result, setResult] = useState<FoodSuggestionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [clarifyText, setClarifyText] = useState('');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const qIdx = QUESTION_STEPS.indexOf(step);
  const isQuestionStep = qIdx !== -1;
  const totalSteps = QUESTION_STEPS.length;
  const progressPct = isQuestionStep ? ((qIdx + 1) / totalSteps) * 100 : 0;
  const stepMeta = STEP_META[step];

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goTo = (next: Step, dir: 1 | -1 = 1) => {
    setDirection(dir);
    setStep(next);
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('foodchain_ai_assistant_dismissed', 'true');
    }
    onClose();
  };

  const handleStart = () => goTo('hunger');

  const handleBack = () => {
    if (qIdx <= 0) goTo('welcome', -1);
    else goTo(QUESTION_STEPS[qIdx - 1], -1);
  };

  const handleNext = () => {
    if (qIdx >= QUESTION_STEPS.length - 1) submitAnswers();
    else goTo(QUESTION_STEPS[qIdx + 1]);
  };

  const canProceed = () => step !== 'hunger' || answers.hungerLevel !== null;

  // ── API call ─────────────────────────────────────────────────────────────────

  const submitAnswers = async (extraNote?: string) => {
    goTo('loading');
    setErrorMsg('');
    setResult(null);
    try {
      const req = buildSuggestionRequest(
        extraNote
          ? { ...answers, notes: [answers.notes, extraNote].filter(Boolean).join('. ') }
          : answers,
        branchId,
        branchName
      );
      const res = await getFoodSuggestions(req);
      setResult(res);
      if (res.readyForSuggestions && res.suggestions.length > 0) {
        goTo('results');
      } else if (res.readyForSuggestions) {
        setErrorMsg('No suggestions matched your preferences. Try adjusting your choices.');
        goTo('error');
      } else if (res.questions?.length > 0) {
        setClarifyText('');
        goTo('clarify');
      } else {
        setErrorMsg(
          res.message || 'Our AI needs a bit more information. Please complete all fields.'
        );
        goTo('error');
      }
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ?? "Couldn't get suggestions right now. Please try again."
      );
      goTo('error');
    }
  };

  const handleStartOver = () => {
    setAnswers(DEFAULT_ANSWERS);
    setResult(null);
    setErrorMsg('');
    setClarifyText('');
    goTo('welcome');
  };

  const handleAddAll = () => {
    if (!result?.suggestions?.length) return;
    result.suggestions.forEach((item) =>
      onAddToCart(
        {
          id: item.menuItemId,
          name: item.menuItemName,
          description: '',
          price: item.price,
          category: '',
          available: true,
        },
        1
      )
    );
    toast.success(`Added ${result.suggestions.length} items to cart`);
  };

  // ── Answer helpers ────────────────────────────────────────────────────────────

  const setSingle = (key: 'hungerLevel' | 'mealType' | 'budget' | 'fulfillmentType', val: string) =>
    setAnswers((a) => ({ ...a, [key]: a[key] === val ? null : val }));

  const toggleMulti = (key: 'moods' | 'dietaryPreferences', val: string) =>
    setAnswers((a) => ({
      ...a,
      [key]: (a[key] as string[]).includes(val)
        ? (a[key] as string[]).filter((v) => v !== val)
        : [...(a[key] as string[]), val],
    }));

  // ── Slide animation ───────────────────────────────────────────────────────────

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 36 : -36, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -36 : 36, opacity: 0 }),
  };

  // ── Step content ──────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className='flex flex-col items-center text-center py-6'>
            <div
              className='w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl select-none'
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--foodchain-golden-amber) 15%, transparent)',
              }}
            >
              🤖
            </div>
            <h2 className='text-lg font-bold mb-2' style={{ color: 'var(--foodchain-espresso)' }}>
              Hi! I'm your AI food assistant
            </h2>
            <p
              className='text-sm mb-5 max-w-xs'
              style={{ color: 'var(--foodchain-charcoal)', opacity: 0.6 }}
            >
              I'll ask you {totalSteps} quick questions and suggest the perfect meal from{' '}
              <span className='font-medium'>{branchName}</span>.
            </p>
            <label
              className='flex items-center gap-2 text-xs cursor-pointer select-none'
              style={{ color: 'var(--foodchain-charcoal)', opacity: 0.45 }}
            >
              <input
                type='checkbox'
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className='rounded-sm'
              />
              Don't show this again
            </label>
          </div>
        );

      case 'hunger':
        return (
          <div className='grid grid-cols-2 gap-2'>
            {HUNGER_OPTIONS.map((o) => (
              <OptionChip
                key={o.label}
                label={o.label}
                emoji={o.emoji}
                selected={answers.hungerLevel === o.label}
                onClick={() => setSingle('hungerLevel', o.label)}
              />
            ))}
          </div>
        );

      case 'mood':
        return (
          <div className='grid grid-cols-2 gap-2'>
            {MOOD_OPTIONS.map((o) => (
              <OptionChip
                key={o.label}
                label={o.label}
                emoji={o.emoji}
                selected={answers.moods.includes(o.label)}
                onClick={() => toggleMulti('moods', o.label)}
              />
            ))}
          </div>
        );

      case 'meal-type':
        return (
          <div className='grid grid-cols-2 gap-2'>
            {MEAL_TYPE_OPTIONS.map((o) => (
              <OptionChip
                key={o.label}
                label={o.label}
                emoji={o.emoji}
                selected={answers.mealType === o.label}
                onClick={() => setSingle('mealType', o.label)}
              />
            ))}
          </div>
        );

      case 'fulfillment':
        return (
          <div className='grid grid-cols-1 gap-2'>
            {FULFILLMENT_OPTIONS.map((o) => (
              <OptionChip
                key={o.label}
                label={o.label}
                emoji={o.emoji}
                selected={answers.fulfillmentType === o.label}
                onClick={() => setSingle('fulfillmentType', o.label)}
              />
            ))}
          </div>
        );

      case 'budget':
        return (
          <div className='grid grid-cols-2 gap-2'>
            {BUDGET_OPTIONS.map((o) => (
              <OptionChip
                key={o.label}
                label={o.label}
                emoji={o.emoji}
                selected={answers.budget === o.label}
                onClick={() => setSingle('budget', o.label)}
              />
            ))}
          </div>
        );

      case 'dietary':
        return (
          <div className='grid grid-cols-2 gap-2'>
            {DIETARY_OPTIONS.map((o) => (
              <OptionChip
                key={o.label}
                label={o.label}
                emoji={o.emoji}
                selected={answers.dietaryPreferences.includes(o.label)}
                onClick={() => toggleMulti('dietaryPreferences', o.label)}
              />
            ))}
          </div>
        );

      case 'notes':
        return (
          <textarea
            value={answers.notes}
            onChange={(e) => setAnswers((a) => ({ ...a, notes: e.target.value }))}
            placeholder='e.g. "No seafood", "I love chicken", "Something filling"'
            rows={5}
            className='w-full rounded-xl border px-3.5 py-3 text-sm resize-none outline-none transition-colors'
            style={{
              borderColor: 'color-mix(in srgb, var(--foodchain-espresso) 20%, transparent)',
              color: 'var(--foodchain-charcoal)',
              backgroundColor: 'transparent',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleNext();
            }}
          />
        );

      case 'loading':
        return (
          <div className='flex flex-col items-center justify-center py-10 gap-4'>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className='text-4xl select-none'
            >
              ✨
            </motion.div>
            <div className='text-center'>
              <p
                className='text-sm font-medium mb-4'
                style={{ color: 'var(--foodchain-espresso)' }}
              >
                Finding the perfect meals for you…
              </p>
              <div className='flex justify-center'>
                <TypingDots />
              </div>
            </div>
            <p className='text-xs' style={{ color: 'var(--foodchain-charcoal)', opacity: 0.4 }}>
              Checking {branchName}'s menu
            </p>
          </div>
        );

      case 'results':
        if (!result?.suggestions?.length) return null;
        return (
          <div className='space-y-2.5'>
            {result.message && (
              <p
                className='text-xs font-medium px-0.5 pb-1'
                style={{ color: 'var(--foodchain-espresso)', opacity: 0.7 }}
              >
                {result.message}
              </p>
            )}
            {result.estimatedTotalCost > 0 && (
              <p
                className='text-xs px-0.5 -mt-1 pb-0.5'
                style={{ color: 'var(--foodchain-charcoal)', opacity: 0.45 }}
              >
                Est. total: ₦{result.estimatedTotalCost.toLocaleString()}
              </p>
            )}
            {result.suggestions.map((item, i) => (
              <motion.div
                key={item.menuItemId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <SuggestionCard item={item} onAddToCart={onAddToCart} />
              </motion.div>
            ))}
          </div>
        );

      case 'error':
        return (
          <div className='flex flex-col items-center justify-center py-10 gap-3 text-center'>
            <div
              className='w-12 h-12 rounded-full flex items-center justify-center'
              style={{ backgroundColor: 'color-mix(in srgb, #ef4444 10%, transparent)' }}
            >
              <AlertCircle className='w-6 h-6 text-red-500' />
            </div>
            <p className='text-sm max-w-xs' style={{ color: 'var(--foodchain-charcoal)' }}>
              {errorMsg}
            </p>
          </div>
        );

      case 'clarify':
        return (
          <div className='space-y-3'>
            {result?.message && (
              <p className='text-sm' style={{ color: 'var(--foodchain-espresso)' }}>
                {result.message}
              </p>
            )}
            {result?.questions?.map((q, i) => (
              <p
                key={i}
                className='text-sm font-medium'
                style={{ color: 'var(--foodchain-espresso)' }}
              >
                • {q}
              </p>
            ))}
            <textarea
              value={clarifyText}
              onChange={(e) => setClarifyText(e.target.value)}
              placeholder='Type your answer here…'
              rows={4}
              className='w-full rounded-xl border px-3.5 py-3 text-sm resize-none outline-none transition-colors'
              style={{
                borderColor: 'color-mix(in srgb, var(--foodchain-espresso) 20%, transparent)',
                color: 'var(--foodchain-charcoal)',
                backgroundColor: 'transparent',
              }}
            />
          </div>
        );
    }
  };

  // ── Footer ────────────────────────────────────────────────────────────────────

  const renderFooter = () => {
    if (step === 'loading') return null;

    if (step === 'welcome') {
      return (
        <div className='flex gap-3'>
          <Button
            variant='ghost'
            onClick={handleClose}
            className='flex-1 text-sm'
            style={{ color: 'var(--foodchain-charcoal)', opacity: 0.55 }}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleStart}
            className='flex-1 text-sm'
            style={{
              backgroundColor: 'var(--foodchain-golden-amber)',
              color: 'var(--foodchain-charcoal)',
            }}
          >
            Let's start →
          </Button>
        </div>
      );
    }

    if (step === 'results') {
      return (
        <div className='flex items-center gap-2 flex-wrap'>
          <Button size='sm' variant='ghost' onClick={handleStartOver} className='text-xs gap-1'>
            <RotateCcw className='w-3.5 h-3.5' />
            Start over
          </Button>
          <Button size='sm' variant='outline' onClick={() => submitAnswers()} className='text-xs gap-1'>
            <RefreshCw className='w-3.5 h-3.5' />
            Regenerate
          </Button>
          <div className='flex-1' />
          <Button
            size='sm'
            onClick={handleAddAll}
            className='text-xs gap-1'
            style={{
              backgroundColor: 'var(--foodchain-espresso)',
              color: 'var(--foodchain-warm-white)',
            }}
          >
            <ShoppingCart className='w-3.5 h-3.5' />
            Add all
          </Button>
          <Button size='sm' variant='outline' onClick={onGoToCart} className='text-xs'>
            View cart
          </Button>
        </div>
      );
    }

    if (step === 'error') {
      return (
        <div className='flex gap-2'>
          <Button variant='ghost' onClick={handleStartOver} className='flex-1 text-sm'>
            Start over
          </Button>
          <Button
            onClick={() => submitAnswers()}
            className='flex-1 text-sm gap-1.5'
            style={{
              backgroundColor: 'var(--foodchain-golden-amber)',
              color: 'var(--foodchain-charcoal)',
            }}
          >
            <RefreshCw className='w-3.5 h-3.5' />
            Try again
          </Button>
        </div>
      );
    }

    if (step === 'clarify') {
      return (
        <div className='flex gap-2'>
          <Button variant='ghost' onClick={handleStartOver} className='flex-1 text-sm'>
            Start over
          </Button>
          <Button
            onClick={() => submitAnswers(clarifyText)}
            disabled={!clarifyText.trim()}
            className='flex-1 text-sm gap-1.5'
            style={{
              backgroundColor: 'var(--foodchain-golden-amber)',
              color: 'var(--foodchain-charcoal)',
            }}
          >
            <Sparkles className='w-3.5 h-3.5' />
            Submit answer
          </Button>
        </div>
      );
    }

    // Question steps
    if (!isQuestionStep) return null;
    const isLast = qIdx === QUESTION_STEPS.length - 1;

    return (
      <div className='flex items-center gap-2'>
        <Button variant='ghost' onClick={handleBack} size='sm' className='gap-1 shrink-0'>
          <ChevronLeft className='w-4 h-4' />
          Back
        </Button>
        <div className='flex-1' />
        {stepMeta?.optional && (
          <Button
            variant='ghost'
            onClick={handleNext}
            size='sm'
            className='text-xs shrink-0'
            style={{ color: 'var(--foodchain-charcoal)', opacity: 0.5 }}
          >
            Skip
          </Button>
        )}
        <Button
          onClick={handleNext}
          size='sm'
          disabled={!canProceed()}
          className='shrink-0 gap-1'
          style={
            canProceed()
              ? {
                  backgroundColor: 'var(--foodchain-golden-amber)',
                  color: 'var(--foodchain-charcoal)',
                }
              : undefined
          }
        >
          {isLast ? (
            <>
              <Sparkles className='w-3.5 h-3.5' />
              Get suggestions
            </>
          ) : (
            <>
              Next
              <ChevronRight className='w-4 h-4' />
            </>
          )}
        </Button>
      </div>
    );
  };

  const footer = renderFooter();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && step !== 'loading') handleClose();
      }}
    >
      {/* Hide the default shadcn X button; we render our own in the header */}
      <DialogContent className='w-full max-w-[440px] p-0 gap-0 overflow-hidden flex flex-col [&>button:last-child]:hidden'>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className='flex items-center justify-between px-5 py-3.5 shrink-0'
          style={{ backgroundColor: 'var(--foodchain-espresso)' }}
        >
          <div className='flex items-center gap-2'>
            <Sparkles
              className='w-4 h-4 shrink-0'
              style={{ color: 'var(--foodchain-golden-amber)' }}
            />
            <span
              className='text-sm font-semibold'
              style={{ color: 'var(--foodchain-warm-white)' }}
            >
              {step === 'results'
                ? `${result?.suggestions?.length ?? 0} suggestions found ✨`
                : 'AI Food Assistant'}
            </span>
          </div>
          <div className='flex items-center gap-3'>
            {isQuestionStep && (
              <span
                className='text-xs tabular-nums'
                style={{ color: 'var(--foodchain-warm-white)', opacity: 0.45 }}
              >
                {qIdx + 1} / {totalSteps}
              </span>
            )}
            {step !== 'loading' && (
              <button
                onClick={handleClose}
                className='p-0.5 rounded-md opacity-50 hover:opacity-100 transition-opacity'
                style={{ color: 'var(--foodchain-warm-white)' }}
              >
                <X className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>

        {/* ── Progress bar ────────────────────────────────────────────────── */}
        {isQuestionStep && (
          <div
            className='h-1 w-full shrink-0'
            style={{
              backgroundColor: 'color-mix(in srgb, var(--foodchain-espresso) 8%, transparent)',
            }}
          >
            <motion.div
              className='h-full'
              style={{ backgroundColor: 'var(--foodchain-golden-amber)' }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* ── Question label ──────────────────────────────────────────────── */}
        {isQuestionStep && stepMeta && (
          <div className='px-5 pt-5 pb-2 shrink-0'>
            <h3 className='font-semibold text-base' style={{ color: 'var(--foodchain-espresso)' }}>
              {stepMeta.question}
            </h3>
            {stepMeta.subtitle && (
              <p
                className='text-xs mt-0.5'
                style={{ color: 'var(--foodchain-charcoal)', opacity: 0.5 }}
              >
                {stepMeta.subtitle}
              </p>
            )}
          </div>
        )}

        {/* ── Animated content ────────────────────────────────────────────── */}
        <div
          className='overflow-y-auto flex-1 px-5 py-4'
          style={{ minHeight: 180, maxHeight: 360 }}
        >
          <AnimatePresence mode='wait' custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial='enter'
              animate='center'
              exit='exit'
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {footer && (
          <div
            className='px-5 py-4 border-t shrink-0'
            style={{
              borderColor: 'color-mix(in srgb, var(--foodchain-espresso) 8%, transparent)',
            }}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
