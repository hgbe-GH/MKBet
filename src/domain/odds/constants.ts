export const MILLISECONDS_PER_DAY = 86_400_000;
export const DEFAULT_MINIMUM_Q = 0.02;
export const DEFAULT_MAXIMUM_Q = 0.98;
export const DEFAULT_MINIMUM_HALF_LIFE_DAYS = 1;
export const DEFAULT_MAXIMUM_HALF_LIFE_DAYS = 365;
export const DEFAULT_MARGIN = 1.08;
export const DEFAULT_MINIMUM_DISPLAYED_ODDS = 1.05;
export const DEFAULT_MAXIMUM_DISPLAYED_ODDS = 50;
export const PROBABILITY_EPSILON = 1e-12;

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function roundDisplayedOdds(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
