export const DIETARY_OPTIONS = [
  'no_restrictions',
  'vegetarian',
  'vegan',
  'halal',
  'high_protein',
  'low_carb',
  'no_seafood',
  'diabetic_friendly',
  'weight_loss',
] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number];

export function formatDietaryLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
