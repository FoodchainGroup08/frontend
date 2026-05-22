// Single source of truth for all recommendation-related enum values.
// Both the Help Me Choose onboarding flow and the Food Preferences profile
// section import from here. The backend preference-based algorithm reads the
// same normalized keys that these constants define.

// ─── Dietary restrictions ─────────────────────────────────────────────────────

export const DIETARY_RESTRICTION_OPTIONS = [
  { key: 'no_restrictions', label: 'No restrictions' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'halal', label: 'Halal' },
  { key: 'high_protein', label: 'High protein' },
  { key: 'low_carb', label: 'Low carb' },
  { key: 'no_seafood', label: 'No seafood' },
  { key: 'diabetic_friendly', label: 'Diabetic-friendly' },
  { key: 'weight_loss', label: 'Weight loss' },
] as const;

export type DietaryRestrictionKey = typeof DIETARY_RESTRICTION_OPTIONS[number]['key'];

// ─── Cuisine preferences ──────────────────────────────────────────────────────

export const CUISINE_PREFERENCE_OPTIONS = [
  { key: 'nigerian', label: 'Nigerian' },
  { key: 'italian', label: 'Italian' },
  { key: 'continental', label: 'Continental' },
  { key: 'asian', label: 'Asian' },
  { key: 'fast_food', label: 'Fast food' },
  { key: 'any', label: 'Any' },
] as const;

// 'any' is a UI-only wildcard. Filter it out before sending cuisinePreferences[].
export type CuisinePreferenceKey = typeof CUISINE_PREFERENCE_OPTIONS[number]['key'];

// ─── Spice level ──────────────────────────────────────────────────────────────

export const SPICE_LEVEL_OPTIONS = [
  { key: 'spice_mild', label: 'Mild' },
  { key: 'spice_medium', label: 'Medium' },
  { key: 'spice_hot', label: 'Spicy' },
] as const;

export type SpiceLevelKey = 'spice_mild' | 'spice_medium' | 'spice_hot';

// ─── Mood / craving ───────────────────────────────────────────────────────────

export const MOOD_OPTIONS = [
  { id: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { id: 'sweet', label: 'Sweet', emoji: '🍬' },
  { id: 'savory', label: 'Savory', emoji: '🧀' },
  { id: 'comfort_food', label: 'Comfort food', emoji: '🍲' },
] as const;

export type MoodKey = typeof MOOD_OPTIONS[number]['id'];

// ─── Hunger / appetite ────────────────────────────────────────────────────────

export const HUNGER_OPTIONS = [
  { id: 'light', label: 'Light snack', emoji: '🍪', appetite: 'light' as const },
  { id: 'moderate', label: 'Moderately hungry', emoji: '🍽️', appetite: 'moderate' as const },
  { id: 'very', label: 'Very hungry', emoji: '🍖', appetite: 'heavy' as const },
] as const;

// ─── Budget presets ───────────────────────────────────────────────────────────

export interface BudgetPreset {
  key: string;
  label: string;
  maxValue: number | null; // null = no cap
  unlimited: boolean;
}

export const BUDGET_PRESETS: BudgetPreset[] = [
  { key: 'under_5000', label: 'Under ₦5,000', maxValue: 4999, unlimited: false },
  { key: 'range_5000_10000', label: '₦5,000–10,000', maxValue: 10000, unlimited: false },
  { key: 'range_10000_15000', label: '₦10,000–15,000', maxValue: 15000, unlimited: false },
  { key: 'above_15000', label: '₦15,000+', maxValue: null, unlimited: true },
];

// ─── Meal type ────────────────────────────────────────────────────────────────

export const MEAL_TYPE_OPTIONS = [
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert',
] as const;

export type MealType = typeof MEAL_TYPE_OPTIONS[number];

// ─── Fulfillment type ─────────────────────────────────────────────────────────

export const FULFILLMENT_TYPE_OPTIONS = [
  'pickup', 'delivery', 'dine-in',
] as const;

export type FulfillmentType = typeof FULFILLMENT_TYPE_OPTIONS[number];

// ─── Migration helper ─────────────────────────────────────────────────────────
// Converts old localStorage values (Title Case labels) to normalized backend keys.
// Safe to call on already-normalized keys — they pass through unchanged.

const OLD_LABEL_TO_KEY: Record<string, string> = {
  'No restrictions': 'no_restrictions',
  'Vegetarian': 'vegetarian',
  'Vegan': 'vegan',
  'Halal': 'halal',
  'High protein': 'high_protein',
  'High Protein': 'high_protein',
  'Low carb': 'low_carb',
  'Low Carb': 'low_carb',
  'No seafood': 'no_seafood',
  'Diabetic-friendly': 'diabetic_friendly',
  'Diabetic-Friendly': 'diabetic_friendly',
  'Weight loss': 'weight_loss',
  'Nigerian': 'nigerian',
  'Italian': 'italian',
  'Continental': 'continental',
  'Asian': 'asian',
  'Fast food': 'fast_food',
  'Any': 'any',
  'Mild': 'spice_mild',
  'Medium': 'spice_medium',
  'Spicy': 'spice_hot',
};

export function normalizePrefKey(value: string): string {
  return OLD_LABEL_TO_KEY[value] ?? value;
}
