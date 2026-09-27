import { Muscle } from '@/types';

export const MUSCLE_LABELS: Record<Muscle, string> = {
  CHEST: 'Chest',
  LATS: 'Lats',
  MIDDLE_BACK: 'Upper Back',
  TRAPS: 'Traps',
  LOWER_BACK: 'Lower Back',
  FRONT_DELTS: 'Front Delts',
  SIDE_DELTS: 'Side Delts',
  REAR_DELTS: 'Rear Delts',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  QUADRICEPS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  ADDUCTORS: 'Adductors',
  ABDUCTORS: 'Abductors',
  ABDOMINALS: 'Abs',
  NECK: 'Neck',
};

export const MUSCLE_GROUPS: { label: string; muscles: Muscle[] }[] = [
  { label: 'PUSH', muscles: ['CHEST', 'FRONT_DELTS', 'SIDE_DELTS', 'TRICEPS'] },
  { label: 'PULL', muscles: ['LATS', 'MIDDLE_BACK', 'REAR_DELTS', 'TRAPS', 'BICEPS', 'FOREARMS'] },
  { label: 'LEGS', muscles: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ADDUCTORS', 'ABDUCTORS'] },
  { label: 'CORE', muscles: ['ABDOMINALS', 'LOWER_BACK', 'NECK'] },
];

export const MUSCLES: Muscle[] = MUSCLE_GROUPS.flatMap((g) => g.muscles);

// Always listed in weekly volume, even when untrained; the rest only once they get sets
export const MAJOR_MUSCLES = new Set<Muscle>([
  'CHEST', 'FRONT_DELTS', 'SIDE_DELTS', 'TRICEPS', 'LATS', 'MIDDLE_BACK', 'REAR_DELTS', 'BICEPS',
  'QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES',
]);

// Hard sets per muscle and week that most hypertrophy guidelines recommend
export const WEEKLY_SET_TARGET = { min: 10, max: 20 };

// A secondary muscle gets half a set
export const SECONDARY_SET_WEIGHT = 0.5;
