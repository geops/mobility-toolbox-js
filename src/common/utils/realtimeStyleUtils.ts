import type {
  AnyCanvasContext,
  RealtimeLine,
  RealtimeMot,
  RealtimeStyleOptions,
  RealtimeTrajectory,
  ViewState,
} from '../../types';

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

export const MOTS_ONLY_RAIL: RealtimeMot[] = ['rail'];

export const MOTS_WITH_CABLE: RealtimeMot[] = [
  'cablecar',
  'gondola',
  'funicular',
  'coach',
];

export const MOTS_WITHOUT_CABLE: RealtimeMot[] = [
  'tram',
  'subway',
  'rail',
  'bus',
];

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

export const getTypeIndex = (type: number | RealtimeMot): number => {
  if (typeof type === 'string') {
    return (
      types.findIndex((t) => {
        return t.test(type);
      }) || 0
    );
  }
  return type;
};

export const getRadiusForTypeAndZoom = (
  type: number | RealtimeMot,
  zoom?: number,
): number => {
  const z = Math.min(Math.floor(zoom ?? 1), 16);
  try {
    const typeIdx = getTypeIndex(type || 0);
    return radiusMapping[typeIdx][z];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return 1;
  }
};

/**
 * @deprecated use getRadiusForTypeAndZoom
 */
export const getRadius = getRadiusForTypeAndZoom;

export const getColorForType = (type: number | RealtimeMot): string => {
  try {
    const typeIdx = getTypeIndex(type);
    return bgColors[typeIdx];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return '#000';
  }
};

/**
 * @deprecated use getColorForType
 */
export const getBgColor = getColorForType;

export const getTextColorForType = (type: number | RealtimeMot): string => {
  try {
    const typeIdx = getTypeIndex(type);
    return textColors[typeIdx];
  } catch (e) {
    return '#ffffff';
  }
};

export const getTextColorForLine = (
  line?: RealtimeLine,
): string | undefined => {
  let color = line?.text_color;

  if (color && !color.startsWith('#')) {
    color = `#${color}`;
  }

  return color;
};

/**
 * @deprecated use getTextColorForType
 */
export const getTextColor = getTextColorForType;

export const getTextSize = (
  ctx?: AnyCanvasContext,
  markerSize?: number,
  text?: string,
  fontSize?: number,
  font?: string,
): number => {
  if (!ctx || !font || !markerSize || !text || !fontSize) {
    return 0;
  }
  ctx.font = font;
  let newText = ctx.measureText(text);

  const maxiter = 25;
  let i = 0;

  while (newText.width > markerSize - 6 && i < maxiter) {
    const previousFontSize = fontSize;
    // eslint-disable-next-line no-param-reassign
    fontSize -= 0.5;
    ctx.font = ctx.font.replace(`${previousFontSize}px`, `${fontSize}px`);
    newText = ctx.measureText(text);
    i += 1;
  }
  return fontSize;
};

export const getDelayColor = (
  delayInMs?: null | number,
  cancelled?: boolean,
  isDelayText?: boolean,
): string => {
  if (cancelled) {
    return isDelayText ? '#ff0000' : '#a0a0a0'; // red or gray
  }
  if (!delayInMs) {
    return '';
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

export const getDelayText = (delay?: number, cancelled?: boolean): string => {
  if (cancelled) {
    return String.fromCodePoint(0x00d7);
  }
  if (!delay) {
    return '';
  }
  if (delay >= 3600000) {
    const rounded = Math.round(delay / 3600000);
    return `+${rounded}h`;
  }

  if (delay >= 60000) {
    const rounded = Math.round(delay / 60000);
    return `+${rounded}m`;
  }

  if (delay >= 1000) {
    const rounded = Math.round(delay / 1000);
    return `+${rounded}s`;
  }

  if (delay > 0) {
    return `+${delay}ms`;
  }

  return '';
};

export const getColorForLine = (line?: RealtimeLine): string | undefined => {
  let color = line?.color;

  if (color && !color.startsWith('#')) {
    color = `#${color}`;
  }

  return color;
};

/**
 * This object is the default style options for the realtime layer.
 * The colors are defined depending of the trajectory`s line, and if it does
 * not exist, depending of the mot type of the trajectory.
 */
export const styleOptionsForMot: Partial<RealtimeStyleOptions> = {
  getColor: (trajectory?: RealtimeTrajectory): string => {
    return (
      getColorForLine(trajectory?.properties?.line) ||
      getColorForType(trajectory?.properties?.type || 0) ||
      '#000'
    );
  },
  getDelayColor: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    delayInMs?: null | number,
    cancelled?: boolean,
    isDelayText?: boolean,
  ): string => {
    return getDelayColor(delayInMs, cancelled, isDelayText) || 'transparent';
  },
  getDelayText: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    delay?: number,
    cancelled?: boolean,
  ): string => {
    return getDelayText(delay, cancelled) || '';
  },
  getRadius: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
  ): number => {
    return (
      getRadiusForTypeAndZoom(
        trajectory?.properties?.type || 0,
        viewState?.zoom,
      ) || 1
    );
  },
  getTextColor: (trajectory: RealtimeTrajectory): string => {
    return (
      getTextColorForLine(trajectory.properties.line) ||
      getTextColorForType(trajectory.properties.type)
    );
  },
  getTextSize: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    ctx?: AnyCanvasContext,
    markerSize?: number,
    text?: string,
    fontSize?: number,
    font?: string,
  ): number => {
    return getTextSize(ctx, markerSize, text, fontSize, font) || 12;
  },
};
