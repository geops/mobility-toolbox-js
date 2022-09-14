import type { RealtimeTrainId } from './realtime';
import type { CopyrightControl as MapboxCopyrightControl } from '../mapbox';
import type { CopyrightControl as OlCopyrightControl } from '../ol';

export type StyleCache = { [key: string]: HTMLCanvasElement | OffscreenCanvas };

export type ViewState = {
  time: number;
  center: number[];
  extent: number[];
  size: number[];
  rotation: number;
  resolution: number;
  zoom: number;
  pixelRatio: number;
};

export type RealtimeStyleOptions = {
  hoverVehicleId: RealtimeTrainId;
  selectedVehicleId: RealtimeTrainId;
  useDelayStyle: boolean;
  delayOutlineColor: string;
  delayDisplay: number;
  getRadius: (type: number, z: number) => number;
  getBgColor: (type: number) => string;
  getDelayColor: (
    delay: number | null,
    cancelled?: boolean,
    isDelayText?: boolean,
  ) => string;
  getDelayText: (delay: number | null, cancelled?: boolean) => string;
  getTextColor: (type: number) => string;
  getTextSize: (
    ctx: CanvasRenderingContext2D | OffscreencanvasRenderingContext2D | null,
    markerSize: number,
    name: string,
    fontSize: number,
  ) => number;
};
export type AnyMap = OlMap | MaplibreMap | MapboxMap;

export type AnyMapboxLayer = MapboxLayer | MaplibreLayer;
export type AnyCopyrightControl = MapboxCopyrightControl | OlCopyrightControl;
export type AnyMapboxMap = mapboxgl.Map | maplibregl.Map;

export type GConstructor<T = {}> = new (...args: any[]) => T;
export type AnyMapboxLayerClass = GConstructor<AnyMapboxLayer>;
export type AnyMapboxMapClass = GConstructor<AnyMapboxMap>;
export type AnyCopyrightControlClass = GConstructor<AnyCopyrightControl>;
