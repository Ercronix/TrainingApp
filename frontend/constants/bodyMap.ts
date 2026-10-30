import type { Muscle } from '@/types';

/**
 * A blocky front and back figure for the body map, drawn as polygons in a 100 × 206 box per
 * view. Shapes are given for the figure's right side (the left of the picture) and mirrored,
 * unless `center` is set. Parts without a muscle (head, hands, knees, feet) are drawn as body.
 */
export interface BodyPart {
  muscle: Muscle | null;
  points: [number, number][];
  center?: boolean;
}

export const BODY_VIEW_WIDTH = 100;
export const BODY_VIEW_HEIGHT = 206;

const HEAD: BodyPart = {
  muscle: null,
  center: true,
  points: [[50, 2], [56, 3.5], [58.5, 9], [58, 16], [55, 22], [50, 24], [45, 22], [42, 16], [41.5, 9], [44, 3.5]],
};

const HAND: BodyPart = { muscle: null, points: [[16, 106], [22.5, 106], [23.5, 113], [20.5, 119], [15.5, 117.5], [14, 111]] };
const KNEE: BodyPart = { muscle: null, points: [[34.5, 152], [45, 152], [45.5, 157.5], [40, 160], [34.5, 157.5]] };
const FOOT: BodyPart = { muscle: null, points: [[37, 194], [43.5, 194], [45.5, 199], [44.5, 204], [36, 204], [35, 199]] };
const SIDE_DELT: BodyPart = { muscle: 'SIDE_DELTS', points: [[30, 31.5], [24.5, 33.5], [21, 40.5], [21.5, 48], [27.5, 51], [26.5, 40]] };
const FOREARM: BodyPart = {
  muscle: 'FOREARMS',
  points: [[31, 78], [21.5, 78], [17.5, 90], [16, 104.5], [22.5, 104.5], [27.5, 92]],
};

export const BODY_FRONT: BodyPart[] = [
  HEAD,
  { muscle: 'NECK', center: true, points: [[45, 21], [55, 21], [56, 29], [50, 31], [44, 29]] },
  { muscle: 'TRAPS', points: [[44.5, 24.5], [43.5, 29.5], [37, 30.5], [34, 30]] },
  SIDE_DELT,
  { muscle: 'FRONT_DELTS', points: [[36.5, 31.5], [31, 31.5], [27.5, 40], [28.5, 51], [33, 45.5], [36, 38]] },
  { muscle: 'CHEST', points: [[49.5, 32.5], [38, 32], [37, 38.5], [34, 46], [35.5, 52], [41.5, 55], [49.5, 53]] },
  { muscle: 'BICEPS', points: [[30, 52], [33, 49], [34, 57], [33.5, 66], [30.5, 76], [25.5, 76.5], [23.5, 66], [24, 54]] },
  { muscle: 'TRICEPS', points: [[22.5, 52], [22.5, 66], [24.5, 76], [21.5, 75.5], [19.5, 66], [20.5, 52]] },
  FOREARM,
  HAND,
  { muscle: 'ABDOMINALS', points: [[49.5, 56], [43.5, 56.5], [43.5, 64], [49.5, 64]] },
  { muscle: 'ABDOMINALS', points: [[49.5, 65.5], [43.5, 65.5], [43.5, 73.5], [49.5, 73.5]] },
  { muscle: 'ABDOMINALS', points: [[49.5, 75], [43.5, 75], [44, 83], [49.5, 83]] },
  { muscle: 'ABDOMINALS', points: [[49.5, 84.5], [44.2, 84.5], [45.5, 93], [49.5, 99]] },
  { muscle: 'ABDOMINALS', points: [[42, 56], [36.5, 54], [34.5, 62], [35.5, 75], [37.5, 87], [43.5, 94], [44, 84], [42, 70]] },
  { muscle: 'ABDUCTORS', points: [[35, 89], [37.5, 95], [35, 108], [31, 113], [31, 101]] },
  { muscle: 'QUADRICEPS', points: [[38.5, 96], [42.5, 103], [43, 126], [39.5, 145], [36.5, 127], [35.5, 110]] },
  { muscle: 'QUADRICEPS', points: [[35, 110.5], [36, 127], [39, 146], [35.5, 150.5], [31.5, 139], [30.5, 117]] },
  { muscle: 'QUADRICEPS', points: [[43.5, 126], [45.5, 132], [45.5, 149], [40.5, 150.5], [40, 146]] },
  { muscle: 'ADDUCTORS', points: [[43.5, 103], [48.5, 108], [48, 116], [45.5, 129], [44, 124], [43.8, 110]] },
  KNEE,
  { muscle: 'CALVES', points: [[43.2, 160.5], [46.5, 165], [47.5, 172], [45.5, 182], [43.2, 187], [42.8, 172]] },
  { muscle: 'CALVES', points: [[36.8, 160.5], [33, 167], [33, 179], [36.5, 188], [37.6, 171]] },
  { muscle: null, points: [[37.8, 160.5], [42.2, 160.5], [41.6, 172], [42.2, 187], [40, 193], [38.2, 188], [38.6, 171]] },
  FOOT,
];

export const BODY_BACK: BodyPart[] = [
  HEAD,
  { muscle: 'TRAPS', points: [[49.5, 19], [45.5, 22], [44, 28], [35, 31], [40.5, 35.5], [45.5, 46], [49.5, 64]] },
  SIDE_DELT,
  { muscle: 'REAR_DELTS', points: [[34.5, 31.5], [31, 31.5], [27.5, 40], [28.5, 51], [32.5, 45], [35.5, 37.5]] },
  { muscle: 'MIDDLE_BACK', points: [[40, 37], [36, 36.5], [33.5, 44], [36.5, 52], [44.5, 56], [45.5, 48]] },
  { muscle: 'LATS', points: [[33, 46.5], [36, 53.5], [44.5, 57.5], [47.5, 64], [44, 75], [40.5, 87], [37, 82], [33.5, 66], [31.5, 53]] },
  { muscle: 'LOWER_BACK', points: [[49.5, 66], [49.5, 97], [43.5, 96], [41.5, 88], [45, 76], [48, 67]] },
  { muscle: 'TRICEPS', points: [[29.5, 52], [33, 49], [34, 57], [33.5, 66], [30.5, 76], [24.5, 76.5], [21.5, 66], [21, 52]] },
  FOREARM,
  HAND,
  { muscle: 'ABDUCTORS', points: [[37, 85], [42, 96], [36, 102.5], [31, 106], [32.5, 95]] },
  { muscle: 'GLUTES', points: [[49.5, 98.5], [43, 97.5], [37, 103.5], [31.5, 107.5], [31.5, 117], [36, 124], [44, 125], [49.5, 121.5]] },
  { muscle: 'HAMSTRINGS', points: [[31.5, 120], [36, 126], [39.5, 127], [39.5, 151], [35.5, 151], [32, 141], [30.5, 128]] },
  { muscle: 'HAMSTRINGS', points: [[40.5, 127], [44.5, 126.5], [47.5, 124.5], [46.5, 140], [44.5, 151], [40.5, 151]] },
  KNEE,
  { muscle: 'CALVES', points: [[35.5, 160], [40, 160], [40.2, 177], [37.5, 182], [33, 173], [33, 165]] },
  { muscle: 'CALVES', points: [[40.8, 160], [45, 160], [47.5, 167], [46.5, 177], [41.5, 182], [40.8, 177]] },
  { muscle: null, points: [[38.2, 183.5], [45, 180.5], [43, 193], [40, 193], [38.5, 188]] },
  FOOT,
];
