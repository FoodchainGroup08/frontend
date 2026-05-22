import { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  ShoppingCart,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Utensils,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import {
  getFoodSuggestions,
  type FoodSuggestionRequest,
  type ComboSuggestion,
  type AiRecommendationResponse,
} from '@/services/api';
import { DIETARY_OPTIONS, formatDietaryLabel } from '@/constants/recommendation';

// ─── Prop types ───────────────────────────────────────────────────────────────

interface AddToCartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

interface AISuggestionsProps {
  branchId: string;
  branchName: string;
  onAddToCart: (item: AddToCartItem, quantity: number) => void;
  onGoToCart: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES: FoodSuggestionRequest['mealType'][] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert',
];

const FULFILLMENT_TYPES: FoodSuggestionRequest['fulfillmentType'][] = [
  'pickup',
  'delivery',
  'dine-in',
];


// ─── Form state ───────────────────────────────────────────────────────────────

interface SuggestionForm {
  budget: string;
  mealType: string;
  appetite: string;
  dietaryRestrictions: string[];
  peopleCount: string;
  fulfillmentType: string;
  limit: string;
}

const DEFAULT_FORM: SuggestionForm = {
  budget: '',
  mealType: '',
  appetite: '',
  dietaryRestrictions: [],
  peopleCount: '1',
  fulfillmentType: '',
  limit: '5',
};

// ─── Health score bar ─────────────────────────────────────────────────────────

function HealthScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 75 ? '#4ade80' :
    pct >= 50 ? '#facc15' : '#f87171';

  return (
    <div className='flex items-center gap-2'>
      <Heart className='w-3.5 h-3.5 shrink-0' style={{ color }} />
      <div className='flex-1 h-1.5 rounded-full overflow-hidden' style={{ backgroundColor: 'color-mix(in srgb, var(--espresso) 10%, transparent)' }}>
        <div
          className='h-full rounded-full transition-all'
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className='text-xs font-semibold tabular-nums shrink-0' style={{ color, minWidth: '2.5rem', textAlign: 'right' }}>
        {pct}/100
      </span>
    </div>
  );
}

// ─── Match badge ──────────────────────────────────────────────────────────────

function MatchBadge() {
  return (
    <span
      className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0'
      style={{
        backgroundColor: 'color-mix(in srgb, var(--golden-amber) 18%, transparent)',
        color: 'var(--golden-amber)',
        border: '1px solid color-mix(in srgb, var(--golden-amber) 35%, transparent)',
      }}
    >
      <Sparkles className='w-3 h-3' />
      Match
    </span>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function SuggestionSkeleton() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
      {[0, 1, 2].map((i) => (
        <Card key={i} className='overflow-hidden'>
          <CardContent className='p-4 space-y-3'>
            <div className='flex justify-between items-start gap-2'>
              <Skeleton className='h-5 w-2/3' />
              <Skeleton className='h-5 w-16 shrink-0' />
            </div>
            <Skeleton className='h-3 w-full rounded-full' />
            <div className='flex gap-1'>
              <Skeleton className='h-5 w-16 rounded-full' />
              <Skeleton className='h-5 w-20 rounded-full' />
            </div>
            <Skeleton className='h-14 w-full rounded-md' />
            <div className='flex gap-2'>
              <Skeleton className='h-9 flex-1 rounded-md' />
              <Skeleton className='h-9 flex-1 rounded-md' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function SuggestionEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className='text-center py-16'>
      <div
        className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
        style={{ backgroundColor: 'color-mix(in srgb, var(--golden-amber) 15%, transparent)' }}
      >
        <Utensils className='w-7 h-7' style={{ color: 'var(--golden-amber)' }} />
      </div>
      <h3 className='text-lg font-semibold mb-2' style={{ color: 'var(--espresso)' }}>
        No suggestions found
      </h3>
      <p className='text-sm mb-6 max-w-xs mx-auto' style={{ color: 'var(--charcoal)', opacity: 0.6 }}>
        Try adjusting your preferences, increasing your budget, or removing dietary filters.
      </p>
      <Button variant='outline' onClick={onReset}>
        Reset Preferences
      </Button>
    </div>
  );
}

// ─── Combo suggestion card ────────────────────────────────────────────────────

function ComboCard({
  combo,
  onAddCombo,
  onAddItem,
}: {
  combo: ComboSuggestion;
  onAddCombo: (combo: ComboSuggestion) => void;
  onAddItem: (item: AddToCartItem, qty: number) => void;
}) {
  const [comboAdded, setComboAdded] = useState(false);

  const handleAddCombo = () => {
    onAddCombo(combo);
    setComboAdded(true);
    setTimeout(() => setComboAdded(false), 2000);
  };

  return (
    <Card
      className='flex flex-col overflow-hidden border transition-shadow hover:shadow-md'
      style={{ borderColor: 'color-mix(in srgb, var(--espresso) 12%, transparent)' }}
    >
      <CardContent className='flex flex-col flex-1 p-4 gap-3'>
        {/* Header: combo name + price + match badge */}
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-base leading-tight' style={{ color: 'var(--espresso)' }}>
              {combo.comboName}
            </h3>
          </div>
          <div className='flex flex-col items-end gap-1 shrink-0'>
            <span className='text-sm font-bold' style={{ color: 'var(--golden-amber)' }}>
              ₦{combo.totalPrice.toLocaleString()}
            </span>
            <MatchBadge />
          </div>
        </div>

        {/* Health score */}
        <HealthScoreBar score={combo.healthScore} />

        {/* Wellness tags */}
        {combo.wellnessTags?.length > 0 && (
          <div className='flex flex-wrap gap-1'>
            {combo.wellnessTags.map((tag) => (
              <Badge
                key={tag}
                variant='secondary'
                className='text-xs'
                style={{
                  backgroundColor: 'color-mix(in srgb, #4ade80 15%, transparent)',
                  color: '#166534',
                  border: '1px solid color-mix(in srgb, #4ade80 30%, transparent)',
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Combo items */}
        <div className='space-y-1.5'>
          {combo.items.map((item) => (
            <div
              key={item.menuItemId}
              className='flex items-center justify-between gap-2 text-sm rounded-md px-2.5 py-1.5'
              style={{ backgroundColor: 'color-mix(in srgb, var(--espresso) 4%, transparent)' }}
            >
              <span className='font-medium truncate' style={{ color: 'var(--espresso)' }}>
                {item.name}
              </span>
              <div className='flex items-center gap-2 shrink-0'>
                <span className='text-xs font-semibold' style={{ color: 'var(--golden-amber)' }}>
                  ₦{item.price.toLocaleString()}
                </span>
                <button
                  className='h-6 w-6 rounded flex items-center justify-center transition-colors'
                  style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}
                  title='Add item to cart'
                  onClick={() =>
                    onAddItem(
                      { id: item.menuItemId, name: item.name, description: '', price: item.price, category: '', available: true },
                      1
                    )
                  }
                >
                  <ShoppingCart className='w-3 h-3' />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Reason */}
        {combo.reason && (
          <div
            className='flex items-start gap-2 rounded-md p-2.5'
            style={{ backgroundColor: 'color-mix(in srgb, var(--golden-amber) 12%, transparent)' }}
          >
            <Sparkles className='w-3.5 h-3.5 mt-0.5 shrink-0' style={{ color: 'var(--golden-amber)' }} />
            <p className='text-xs leading-relaxed' style={{ color: 'var(--espresso)', opacity: 0.85 }}>
              {combo.reason}
            </p>
          </div>
        )}

        {/* Add combo CTA */}
        <Button
          className='mt-auto w-full transition-colors'
          size='sm'
          onClick={handleAddCombo}
          style={{
            backgroundColor: comboAdded ? 'var(--sage-green)' : 'var(--espresso)',
            color: 'var(--warm-white)',
          }}
        >
          <ShoppingCart className='w-4 h-4 mr-1.5' />
          {comboAdded ? 'Added!' : 'Add Combo to Cart'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export function AISuggestions({
  branchId,
  branchName,
  onAddToCart,
  onGoToCart,
}: AISuggestionsProps) {
  const [form, setForm] = useState<SuggestionForm>(DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiRecommendationResponse | null>(null);
  const [error, setError] = useState('');

  const toggleDietary = (pref: string) => {
    setForm((f) => {
      if (pref === 'no_restrictions') {
        return {
          ...f,
          dietaryRestrictions: f.dietaryRestrictions.includes('no_restrictions')
            ? []
            : ['no_restrictions'],
        };
      }
      if (!f.dietaryRestrictions.includes(pref) && f.dietaryRestrictions.filter(d => d !== 'no_restrictions').length >= 3) return f;
      return {
        ...f,
        dietaryRestrictions: f.dietaryRestrictions.includes(pref)
          ? f.dietaryRestrictions.filter((p) => p !== pref)
          : [...f.dietaryRestrictions.filter((p) => p !== 'no_restrictions'), pref],
      };
    });
  };

  const buildRequest = (): FoodSuggestionRequest => {
    const restrictions = form.dietaryRestrictions.filter((d) => d !== 'no_restrictions');
    return {
      branchId,
      branchName,
      ...(form.budget && { budget: parseFloat(form.budget) }),
      ...(form.mealType && { mealType: form.mealType as FoodSuggestionRequest['mealType'] }),
      ...(form.appetite && { appetite: form.appetite as FoodSuggestionRequest['appetite'] }),
      ...(restrictions.length > 0 && { dietaryRestrictions: restrictions }),
      ...(form.peopleCount && { peopleCount: parseInt(form.peopleCount, 10) }),
      ...(form.fulfillmentType && { fulfillmentType: form.fulfillmentType as FoodSuggestionRequest['fulfillmentType'] }),
      ...(form.limit && { limit: parseInt(form.limit, 10) }),
    };
  };

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getFoodSuggestions(buildRequest());
      setResult(response);
      if (response.readyForSuggestions && response.suggestions.length > 0) {
          toast.success(`Found ${response.suggestions.length} match${response.suggestions.length > 1 ? 'es' : ''} for you!`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to get suggestions. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchSuggestions();
  };

  const handleAddCombo = (combo: ComboSuggestion) => {
    combo.items.forEach((item) =>
      onAddToCart(
        { id: item.menuItemId, name: item.name, description: '', price: item.price, category: '', available: true },
        1
      )
    );
    toast.success(`Added "${combo.comboName}" to cart`);
  };

  const handleAddAll = () => {
    if (!result?.suggestions?.length) return;
    result.suggestions.forEach((combo) => handleAddCombo(combo));
    toast.success(`Added all ${result.suggestions.length} combos to cart`);
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError('');
  };

  const hasResults = result?.readyForSuggestions && (result.suggestions?.length ?? 0) > 0;
  const hasQuestions = result && !result.readyForSuggestions && (result.questions?.length ?? 0) > 0;
  const hasEmptyResults = result?.readyForSuggestions && (result.suggestions?.length ?? 0) === 0;

  const selectStyle: React.CSSProperties = {
    borderColor: 'var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--charcoal)',
  };

  return (
    <div className='min-h-screen pb-16' style={{ backgroundColor: 'var(--warm-white)' }}>
      <div className='max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8'>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className='mb-8'>
          <div className='flex items-center gap-2 mb-1'>
            <Sparkles className='w-6 h-6' style={{ color: 'var(--golden-amber)' }} />
            <h1 className='text-2xl font-bold' style={{ color: 'var(--espresso)' }}>
              Help Me Choose
            </h1>
          </div>
          <p className='text-sm' style={{ color: 'var(--charcoal)', opacity: 0.6 }}>
            Set your preferences and we'll find the best meal combos from {branchName}.
          </p>
        </div>

        {/* ── Preferences form ────────────────────────────────────────────── */}
        <Card className='mb-8 border' style={{ borderColor: 'color-mix(in srgb, var(--espresso) 12%, transparent)' }}>
          <CardHeader className='pb-4'>
            <CardTitle className='text-base' style={{ color: 'var(--espresso)' }}>
              Your Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Row 1: Budget / People / Max results */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-medium' style={{ color: 'var(--espresso)' }}>
                    Budget (₦) — optional
                  </label>
                  <Input
                    type='number' placeholder='e.g. 5000' min={0} value={form.budget}
                    onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs font-medium' style={{ color: 'var(--espresso)' }}>
                    Number of People
                  </label>
                  <Input
                    type='number' min={1} max={50} value={form.peopleCount}
                    onChange={(e) => setForm((f) => ({ ...f, peopleCount: e.target.value }))}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs font-medium' style={{ color: 'var(--espresso)' }}>
                    Max Combos (1–10)
                  </label>
                  <Input
                    type='number' min={1} max={10} value={form.limit}
                    onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 2: Meal type / Appetite / Order type */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-medium' style={{ color: 'var(--espresso)' }}>Meal Type</label>
                  <select value={form.mealType} onChange={(e) => setForm((f) => ({ ...f, mealType: e.target.value }))}
                    className='w-full h-9 rounded-md border px-3 py-1 text-sm' style={selectStyle}>
                    <option value=''>Any</option>
                    {MEAL_TYPES.map((t) => (
                      <option key={t} value={t}>{t!.charAt(0).toUpperCase() + t!.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs font-medium' style={{ color: 'var(--espresso)' }}>Appetite</label>
                  <select value={form.appetite} onChange={(e) => setForm((f) => ({ ...f, appetite: e.target.value }))}
                    className='w-full h-9 rounded-md border px-3 py-1 text-sm' style={selectStyle}>
                    <option value=''>Any</option>
                    <option value='light'>Light</option>
                    <option value='moderate'>Moderate</option>
                    <option value='heavy'>Heavy</option>
                  </select>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-xs font-medium' style={{ color: 'var(--espresso)' }}>Order Type</label>
                  <select value={form.fulfillmentType}
                    onChange={(e) => setForm((f) => ({ ...f, fulfillmentType: e.target.value }))}
                    className='w-full h-9 rounded-md border px-3 py-1 text-sm' style={selectStyle}>
                    <option value=''>Any</option>
                    {FULFILLMENT_TYPES.map((ft) => (
                      <option key={ft} value={ft}>{ft!.charAt(0).toUpperCase() + ft!.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dietary preference toggles */}
              <div className='space-y-2'>
                <label className='text-xs font-medium' style={{ color: 'var(--espresso)' }}>
                  Dietary Restrictions <span style={{ opacity: 0.5 }}>(max 3)</span>
                </label>
                <div className='flex flex-wrap gap-2'>
                  {DIETARY_OPTIONS.map((pref) => {
                    const active = form.dietaryRestrictions.includes(pref);
                    return (
                      <button key={pref} type='button' onClick={() => toggleDietary(pref)}
                        className='px-3 py-1 rounded-full text-xs font-medium border transition-all'
                        style={{
                          backgroundColor: active ? 'var(--espresso)' : 'transparent',
                          color: active ? 'var(--warm-white)' : 'var(--espresso)',
                          borderColor: 'var(--espresso)',
                        }}>
                        {formatDietaryLabel(pref)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className='flex flex-col sm:flex-row gap-3 pt-1'>
                <Button type='submit' disabled={isLoading} className='sm:w-auto'
                  style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--charcoal)' }}>
                  {isLoading ? (
                    <><RefreshCw className='w-4 h-4 mr-2 animate-spin' />Finding matches…</>
                  ) : (
                    <><Sparkles className='w-4 h-4 mr-2' />Find My Match</>
                  )}
                </Button>
                {result && (
                  <Button type='button' variant='outline' onClick={() => fetchSuggestions()} disabled={isLoading} className='sm:w-auto'>
                    <RefreshCw className='w-4 h-4 mr-2' />Regenerate
                  </Button>
                )}
                {(result || error) && (
                  <Button type='button' variant='ghost' onClick={handleReset} disabled={isLoading} className='sm:w-auto'>
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && !isLoading && (
          <div className='flex items-start gap-3 p-4 rounded-lg border mb-6'
            style={{ borderColor: 'color-mix(in srgb, #ef4444 30%, transparent)', backgroundColor: 'color-mix(in srgb, #ef4444 8%, transparent)' }}>
            <AlertCircle className='w-5 h-5 shrink-0 mt-0.5 text-red-500' />
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        {/* ── Loading skeletons ────────────────────────────────────────────── */}
        {isLoading && <SuggestionSkeleton />}

        {/* ── More info needed ─────────────────────────────────────────────── */}
        {!isLoading && hasQuestions && (
          <div className='flex items-start gap-3 p-5 rounded-lg border mb-6'
            style={{ borderColor: 'color-mix(in srgb, var(--golden-amber) 40%, transparent)', backgroundColor: 'color-mix(in srgb, var(--golden-amber) 10%, transparent)' }}>
            <HelpCircle className='w-5 h-5 shrink-0 mt-0.5' style={{ color: 'var(--golden-amber)' }} />
            <div>
              <p className='text-sm font-semibold mb-3' style={{ color: 'var(--espresso)' }}>{result!.message}</p>
              <ol className='space-y-1.5'>
                {result!.questions.map((q, i) => (
                  <li key={i} className='text-sm flex items-start gap-2' style={{ color: 'var(--charcoal)' }}>
                    <span className='font-bold shrink-0 tabular-nums' style={{ color: 'var(--golden-amber)' }}>{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ol>
              <p className='text-xs mt-3' style={{ color: 'var(--charcoal)', opacity: 0.5 }}>
                Update your preferences above and click "Find My Match" again.
              </p>
            </div>
          </div>
        )}

        {/* ── Suggestions results ──────────────────────────────────────────── */}
        {!isLoading && hasResults && (
          <div>
            {/* Results bar */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5'>
              <div>
                <div className='flex items-center gap-2 mb-0.5'>
                  <p className='text-sm font-medium' style={{ color: 'var(--espresso)' }}>{result!.message}</p>
                  <MatchBadge />
                </div>
                {result!.estimatedTotalCost > 0 && (
                  <p className='text-xs mt-0.5' style={{ color: 'var(--charcoal)', opacity: 0.55 }}>
                    Estimated total from first combo:{' '}
                    <span className='font-semibold'>₦{result!.estimatedTotalCost.toLocaleString()}</span>
                  </p>
                )}
              </div>
              <div className='flex gap-2 shrink-0'>
                <Button size='sm' onClick={handleAddAll}
                  style={{ backgroundColor: 'var(--espresso)', color: 'var(--warm-white)' }}>
                  <ShoppingCart className='w-4 h-4 mr-1.5' />Add All to Cart
                </Button>
                <Button size='sm' variant='outline' onClick={onGoToCart}>
                  View Cart<ChevronRight className='w-4 h-4 ml-1' />
                </Button>
              </div>
            </div>

            {/* Combo cards grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {result!.suggestions.map((combo, i) => (
                <ComboCard
                  key={`${combo.comboName}-${i}`}
                  combo={combo}
                  onAddCombo={handleAddCombo}
                  onAddItem={onAddToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!isLoading && hasEmptyResults && <SuggestionEmptyState onReset={handleReset} />}
      </div>
    </div>
  );
}
