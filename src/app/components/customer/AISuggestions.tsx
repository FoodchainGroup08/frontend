import { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  ShoppingCart,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Utensils,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import {
  getFoodSuggestions,
  type FoodSuggestionRequest,
  type FoodSuggestionItem,
  type FoodSuggestionResponse,
} from "@/services/api";

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

const MEAL_TYPES: FoodSuggestionRequest["mealType"][] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "dessert",
];

const FULFILLMENT_TYPES: FoodSuggestionRequest["fulfillmentType"][] = [
  "pickup",
  "delivery",
  "dine-in",
];

const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "spicy",
  "non-spicy",
  "low sugar",
  "high protein",
  "halal",
  "gluten-free",
];

// ─── Form state ───────────────────────────────────────────────────────────────

interface SuggestionForm {
  budget: string;
  mealType: string;
  appetite: string;
  dietaryPreferences: string[];
  peopleCount: string;
  fulfillmentType: string;
  limit: string;
}

const DEFAULT_FORM: SuggestionForm = {
  budget: "",
  mealType: "",
  appetite: "",
  dietaryPreferences: [],
  peopleCount: "1",
  fulfillmentType: "",
  limit: "5",
};

// ─── Loading skeletons ────────────────────────────────────────────────────────

function SuggestionSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-16 shrink-0" />
            </div>
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function SuggestionEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: "color-mix(in srgb, var(--foodchain-golden-amber) 15%, transparent)" }}
      >
        <Utensils className="w-7 h-7" style={{ color: "var(--foodchain-golden-amber)" }} />
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--foodchain-espresso)" }}
      >
        No suggestions found
      </h3>
      <p
        className="text-sm mb-6 max-w-xs mx-auto"
        style={{ color: "var(--foodchain-charcoal)", opacity: 0.6 }}
      >
        Try adjusting your preferences, increasing your budget, or removing
        some dietary filters.
      </p>
      <Button variant="outline" onClick={onReset}>
        Reset Preferences
      </Button>
    </div>
  );
}

// ─── Individual suggestion card ───────────────────────────────────────────────

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
        description: "",
        price: item.price,
        category: "",
        available: true,
      },
      1
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <Card
      className="flex flex-col overflow-hidden border transition-shadow hover:shadow-md"
      style={{ borderColor: "color-mix(in srgb, var(--foodchain-espresso) 12%, transparent)" }}
    >
      <CardContent className="flex flex-col flex-1 p-4 gap-3">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-semibold text-base leading-tight"
            style={{ color: "var(--foodchain-espresso)" }}
          >
            {item.menuItemName}
          </h3>
          <span
            className="text-sm font-bold shrink-0"
            style={{ color: "var(--foodchain-golden-amber)" }}
          >
            ₦{item.price.toLocaleString()}
          </span>
        </div>

        {/* AI reason chip */}
        <div
          className="flex items-start gap-2 rounded-md p-2.5"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--foodchain-golden-amber) 12%, transparent)",
          }}
        >
          <Sparkles
            className="w-3.5 h-3.5 mt-0.5 shrink-0"
            style={{ color: "var(--foodchain-golden-amber)" }}
          />
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--foodchain-espresso)", opacity: 0.85 }}
          >
            {item.reason}
          </p>
        </div>

        {/* Optional add-on combos */}
        {item.optionalAddOns?.length > 0 && (
          <div>
            <p
              className="text-xs mb-1.5"
              style={{ color: "var(--foodchain-charcoal)", opacity: 0.5 }}
            >
              Pairs well with:
            </p>
            <div className="flex flex-wrap gap-1">
              {item.optionalAddOns.map((addon) => (
                <Badge key={addon} variant="secondary" className="text-xs">
                  {addon}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Estimated total when ordering for multiple people */}
        {item.estimatedTotalCost > item.price && (
          <p
            className="text-xs"
            style={{ color: "var(--foodchain-charcoal)", opacity: 0.5 }}
          >
            Est. total: ₦{item.estimatedTotalCost.toLocaleString()}
          </p>
        )}

        {/* CTA */}
        <Button
          className="mt-auto w-full transition-colors"
          size="sm"
          onClick={handleAdd}
          style={{
            backgroundColor: justAdded
              ? "var(--foodchain-sage-green)"
              : "var(--foodchain-espresso)",
            color: "var(--foodchain-warm-white)",
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-1.5" />
          {justAdded ? "Added!" : "Add to Cart"}
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
  const [result, setResult] = useState<FoodSuggestionResponse | null>(null);
  const [error, setError] = useState("");

  const toggleDietary = (pref: string) => {
    setForm((f) => ({
      ...f,
      dietaryPreferences: f.dietaryPreferences.includes(pref)
        ? f.dietaryPreferences.filter((p) => p !== pref)
        : [...f.dietaryPreferences, pref],
    }));
  };

  const buildRequest = (): FoodSuggestionRequest => ({
    branchId,
    branchName,
    ...(form.budget && { budget: parseFloat(form.budget) }),
    ...(form.mealType && {
      mealType: form.mealType as FoodSuggestionRequest["mealType"],
    }),
    ...(form.appetite && {
      appetite: form.appetite as FoodSuggestionRequest["appetite"],
    }),
    ...(form.dietaryPreferences.length > 0 && {
      dietaryPreferences: form.dietaryPreferences,
    }),
    ...(form.peopleCount && { peopleCount: parseInt(form.peopleCount, 10) }),
    ...(form.fulfillmentType && {
      fulfillmentType:
        form.fulfillmentType as FoodSuggestionRequest["fulfillmentType"],
    }),
    ...(form.limit && { limit: parseInt(form.limit, 10) }),
  });

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getFoodSuggestions(buildRequest());
      setResult(response);
      if (response.readyForSuggestions && response.suggestions.length > 0) {
        toast.success(
          `Found ${response.suggestions.length} suggestion${response.suggestions.length > 1 ? "s" : ""} for you!`
        );
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "Failed to get suggestions. Please try again.";
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

  const handleAddAll = () => {
    if (!result?.suggestions?.length) return;
    result.suggestions.forEach((item) =>
      onAddToCart(
        {
          id: item.menuItemId,
          name: item.menuItemName,
          description: "",
          price: item.price,
          category: "",
          available: true,
        },
        1
      )
    );
    toast.success(`Added ${result.suggestions.length} items to cart`);
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError("");
  };

  const hasResults =
    result?.readyForSuggestions && (result.suggestions?.length ?? 0) > 0;
  const hasQuestions =
    result && !result.readyForSuggestions && (result.questions?.length ?? 0) > 0;
  const hasEmptyResults =
    result?.readyForSuggestions && (result.suggestions?.length ?? 0) === 0;

  // ── Select style shared between all <select> elements ──────────────────────
  const selectStyle: React.CSSProperties = {
    borderColor: "var(--border)",
    backgroundColor: "transparent",
    color: "var(--foodchain-charcoal)",
  };

  return (
    <div
      className="min-h-screen pb-16"
      style={{ backgroundColor: "var(--foodchain-warm-white)" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles
              className="w-6 h-6"
              style={{ color: "var(--foodchain-golden-amber)" }}
            />
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--foodchain-espresso)" }}
            >
              AI Food Suggestions
            </h1>
          </div>
          <p
            className="text-sm"
            style={{ color: "var(--foodchain-charcoal)", opacity: 0.6 }}
          >
            Tell us what you're craving and our AI will find the best dishes
            from {branchName}.
          </p>
        </div>

        {/* ── Preferences form ────────────────────────────────────────────── */}
        <Card
          className="mb-8 border"
          style={{
            borderColor:
              "color-mix(in srgb, var(--foodchain-espresso) 12%, transparent)",
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle
              className="text-base"
              style={{ color: "var(--foodchain-espresso)" }}
            >
              Your Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Row 1: Budget / People / Max results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    Budget (₦) — optional
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    min={0}
                    value={form.budget}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, budget: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    Number of People
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={form.peopleCount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, peopleCount: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    Max Suggestions (1–10)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={form.limit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, limit: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Row 2: Meal type / Appetite / Order type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    Meal Type
                  </label>
                  <select
                    value={form.mealType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mealType: e.target.value }))
                    }
                    className="w-full h-9 rounded-md border px-3 py-1 text-sm"
                    style={selectStyle}
                  >
                    <option value="">Any</option>
                    {MEAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t!.charAt(0).toUpperCase() + t!.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    Appetite
                  </label>
                  <select
                    value={form.appetite}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, appetite: e.target.value }))
                    }
                    className="w-full h-9 rounded-md border px-3 py-1 text-sm"
                    style={selectStyle}
                  >
                    <option value="">Any</option>
                    <option value="light">Light</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--foodchain-espresso)" }}
                  >
                    Order Type
                  </label>
                  <select
                    value={form.fulfillmentType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        fulfillmentType: e.target.value,
                      }))
                    }
                    className="w-full h-9 rounded-md border px-3 py-1 text-sm"
                    style={selectStyle}
                  >
                    <option value="">Any</option>
                    {FULFILLMENT_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft!.charAt(0).toUpperCase() + ft!.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dietary preference toggles */}
              <div className="space-y-2">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--foodchain-espresso)" }}
                >
                  Dietary Preferences
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((pref) => {
                    const active = form.dietaryPreferences.includes(pref);
                    return (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => toggleDietary(pref)}
                        className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                        style={{
                          backgroundColor: active
                            ? "var(--foodchain-espresso)"
                            : "transparent",
                          color: active
                            ? "var(--foodchain-warm-white)"
                            : "var(--foodchain-espresso)",
                          borderColor: "var(--foodchain-espresso)",
                        }}
                      >
                        {pref}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="sm:w-auto"
                  style={{
                    backgroundColor: "var(--foodchain-golden-amber)",
                    color: "var(--foodchain-charcoal)",
                  }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Getting suggestions…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get AI Suggestions
                    </>
                  )}
                </Button>

                {result && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchSuggestions()}
                    disabled={isLoading}
                    className="sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                )}

                {(result || error) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="sm:w-auto"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && !isLoading && (
          <div
            className="flex items-start gap-3 p-4 rounded-lg border mb-6"
            style={{
              borderColor: "color-mix(in srgb, #ef4444 30%, transparent)",
              backgroundColor: "color-mix(in srgb, #ef4444 8%, transparent)",
            }}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ── Loading skeletons ────────────────────────────────────────────── */}
        {isLoading && <SuggestionSkeleton />}

        {/* ── AI is asking for more info ───────────────────────────────────── */}
        {!isLoading && hasQuestions && (
          <div
            className="flex items-start gap-3 p-5 rounded-lg border mb-6"
            style={{
              borderColor:
                "color-mix(in srgb, var(--foodchain-golden-amber) 40%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--foodchain-golden-amber) 10%, transparent)",
            }}
          >
            <HelpCircle
              className="w-5 h-5 shrink-0 mt-0.5"
              style={{ color: "var(--foodchain-golden-amber)" }}
            />
            <div>
              <p
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--foodchain-espresso)" }}
              >
                {result!.message}
              </p>
              <ol className="space-y-1.5">
                {result!.questions.map((q, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2"
                    style={{ color: "var(--foodchain-charcoal)" }}
                  >
                    <span
                      className="font-bold shrink-0 tabular-nums"
                      style={{ color: "var(--foodchain-golden-amber)" }}
                    >
                      {i + 1}.
                    </span>
                    {q}
                  </li>
                ))}
              </ol>
              <p
                className="text-xs mt-3"
                style={{ color: "var(--foodchain-charcoal)", opacity: 0.5 }}
              >
                Fill in the form above and click "Get AI Suggestions" again.
              </p>
            </div>
          </div>
        )}

        {/* ── Suggestions results ──────────────────────────────────────────── */}
        {!isLoading && hasResults && (
          <div>
            {/* Results bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--foodchain-espresso)" }}
                >
                  {result!.message}
                </p>
                {result!.estimatedTotalCost > 0 && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--foodchain-charcoal)", opacity: 0.55 }}
                  >
                    Estimated total:{" "}
                    <span className="font-semibold">
                      ₦{result!.estimatedTotalCost.toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={handleAddAll}
                  style={{
                    backgroundColor: "var(--foodchain-espresso)",
                    color: "var(--foodchain-warm-white)",
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Add All to Cart
                </Button>
                <Button size="sm" variant="outline" onClick={onGoToCart}>
                  View Cart
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Cards grid — 1 col mobile, 2 tablet, 3 desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result!.suggestions.map((item) => (
                <SuggestionCard
                  key={item.menuItemId}
                  item={item}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!isLoading && hasEmptyResults && (
          <SuggestionEmptyState onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
