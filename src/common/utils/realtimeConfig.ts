import { AnyCanvasContext, RealtimeMot } from '../../types';

const radiusMapping: number[][] = [
  [0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [0, 0, 0, 0, 0, 2, 2, 3, 7, 7, 7, 12, 15, 15, 15, 15, 15],
  [0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  [0, 0, 0, 0, 0, 2, 2, 3, 7, 7, 7, 12, 15, 15, 15, 15, 15],
];

/**
 * @private
 */
export const MOTS_ONLY_RAIL: RealtimeMot[] = ['rail'];

/**
 * @private
 */
export const MOTS_WITH_CABLE: RealtimeMot[] = [
  'cablecar',
  'gondola',
  'funicular',
  'coach',
];

/**
 * @private
 */
export const MOTS_WITHOUT_CABLE: RealtimeMot[] = [
  'tram',
  'subway',
  'rail',
  'bus',
];

/**
 * @private
 */
export const MOTS_ALL: RealtimeMot[] = [
  'tram',
  'subway',
  'rail',
  'bus',
  'ferry',
  'cablecar',
  'gondola',
  'funicular',
  'coach',
];

/**
 * Trajserv value: 'Tram',  'Subway / Metro / S-Bahn',  'Train', 'Bus', 'Ferry', 'Cable Car', 'Gondola', 'Funicular', 'Long distance bus', 'Rail',
 * New endpoint use Rail instead of Train.
 * New tracker values:  null, "tram", "subway", "rail", "bus", "ferry", "cablecar", "gondola", "funicular", "coach".
 *
 * @private
 */
export const types: RegExp[] = [
  /^Tram/i,
  /^Subway( \/ Metro \/ S-Bahn)?/i,
  /^Train/i,
  /^Bus/i,
  /^Ferry/i,
  /^Cable ?Car/i,
  /^Gondola/i,
  /^Funicular/i,
  /^(Long distance bus|coach)/i,
  /^Rail/i, // New endpoint use Rail instead of Train.
];

/**
 * @private
 */
export const bgColors: string[] = [
  '#ffb400',
  '#ff5400',
  '#ff8080',
  '#ea0000',
  '#3000ff',
  '#ffb400',
  '#41a27b',
  '#00d237',
  '#b5b5b5',
  '#ff8080',
];

/**
 * @private
 */
export const textColors: string[] = [
  '#000000',
  '#ffffff',
  '#000000',
  '#ffffff',
  '#ffffff',
  '#000000',
  '#ffffff',
  '#000000',
  '#000000',
  '#000000',
];

/**
 * @private
 */
export const getTypeIndex = (type: RealtimeMot): number => {
  if (typeof type === 'string') {
    return types.findIndex((t) => t.test(type));
  }
  return type;
};

/**
 * @private
 */
export const getRadius = (type: RealtimeMot, zoom: number): number => {
  try {
    const typeIdx = getTypeIndex(type || 0);
    return radiusMapping[typeIdx][zoom];
  } catch (e) {
    return 1;
  }
};

/**
 * @private
 */
export const getBgColor = (type: RealtimeMot): string => {
  try {
    const typeIdx = getTypeIndex(type);
    return bgColors[typeIdx];
  } catch (e) {
    return '#ffffff';
  }
};

/**
 * @private
 */
export const getTextColor = (type: RealtimeMot): string => {
  try {
    const typeIdx = getTypeIndex(type);
    return textColors[typeIdx];
  } catch (e) {
    return '#ffffff';
  }
};

/**
 * @private
 */
export const getTextSize = (
  ctx: AnyCanvasContext,
  markerSize: number,
  text: string,
  fontSize: number,
  getTextFont: (fontSize: number, text?: string) => string,
): number => {
  if (!ctx) {
    return 0;
  }
  ctx.font = getTextFont(fontSize, text);
  let newText = ctx.measureText(text);

  const maxiter = 25;
  let i = 0;

  while (newText.width > markerSize - 6 && i < maxiter) {
    // eslint-disable-next-line no-param-reassign
    fontSize -= 0.5;
    ctx.font = getTextFont(fontSize, text);
    newText = ctx.measureText(text);
    i += 1;
  }
  return fontSize;
};

/**
 * @private
 * @param {number} delayInMs Delay in milliseconds.
 * @param {boolean} cancelled true if the journey is cancelled.
 * @param {boolean} isDelayText true if the color is used for delay text of the symbol.
 */
export const getDelayColor = (
  delayInMs: null | number,
  cancelled?: boolean,
  isDelayText?: boolean,
): string => {
  if (cancelled) {
    return isDelayText ? '#ff0000' : '#a0a0a0'; // red or gray
  }
  if (delayInMs === null) {
    return '#a0a0a0'; // grey { r: 160, g: 160, b: 160, s: '160,160,160' };
  }
  if (delayInMs >= 3600000) {
    return '#ed004c'; // pink { r: 237, g: 0, b: 76, s: '237,0,76' };
  }
  if (delayInMs >= 500000) {
    return '#e80000'; // red { r: 232, g: 0, b: 0, s: '232,0,0' };
  }
  if (delayInMs >= 300000) {
    return '#ff4a00'; // orange { r: 255, g: 74, b: 0, s: '255,74,0' };
  }
  if (delayInMs >= 180000) {
    return '#f7bf00'; // yellow { r: 247, g: 191, b: 0, s: '247,191,0' };
  }
  return '#00a00c'; // green { r: 0, g: 160, b: 12, s: '0,160,12' };
};

/**
 * @private
 */
export const getDelayText = (delayInMs: number, cancelled: boolean): string => {
  if (cancelled) {
    return String.fromCodePoint(0x00d7);
  }
  if (delayInMs >= 3600000) {
    const rounded = Math.round(delayInMs / 3600000);
    return `+${rounded}h`;
  }

  if (delayInMs >= 60000) {
    const rounded = Math.round(delayInMs / 60000);
    return `+${rounded}m`;
  }

  if (delayInMs >= 1000) {
    const rounded = Math.round(delayInMs / 1000);
    return `+${rounded}s`;
  }

  if (delayInMs > 0) {
    return `+${delayInMs}ms`;
  }

  return '';
};
