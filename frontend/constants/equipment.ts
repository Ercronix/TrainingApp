/** Equipment a library exercise can be set to, in the catalog's vocabulary. */
export const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'cable', 'machine', 'body only', 'kettlebells', 'bands', 'other',
] as const;

/** Plates only make sense on a loaded bar. */
export const usesPlates = (equipment: string | null | undefined) => equipment === 'barbell';
