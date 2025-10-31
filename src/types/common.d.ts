import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { Pixel } from 'ol/pixel';

import { RealtimeTrajectory } from '../api/typedefs';

import type {
  CopyrightControl as MbCopyrightControl,
  layer as MbLayer,
  RealtimeLayer as MbRealtimeLayer,
} from '../maplibre';
import type {
  MapboxLayer,
  MaplibreLayer,
  MapsetLayer,
  CopyrightControl as OlCopyrightControl,
  layer as OlLayer,
  RealtimeLayer as OlRealtimeLayer,
} from '../ol';

import type { RealtimeLine, RealtimeMot, RealtimeTrainId } from './realtime';

import type { RoutingParameters } from '.';

export type StyleCache = Record<string, AnyCanvas>;

export interface ViewState {
  center?: number[];
  extent?: number[];
  pixelRatio?: number;
  resolution?: number;
  rotation?: number;
  size?: number[];
  time?: number;
  zoom?: number;
  visible?: boolean;
}

export interface RealtimeStyleOptions {
  delayDisplay?: number;
  delayOutlineColor?: string;
  filter?: FilterFunction;
  getBgColor?: (type: RealtimeMot, line?: RealtimeLine) => string;
  getDelayColor?: (
    delay: null | number,
    cancelled?: boolean,
    isDelayText?: boolean,
  ) => string;
  getDelayFont?: (fontSize: number, text?: string) => string;
  getDelayText?: (delay: null | number, cancelled?: boolean) => string;
  getMaxRadiusForStrokeAndDelay?: () => number;
  getMaxRadiusForText?: () => number;
  getRadius?: (type: RealtimeMot, z: number) => number;
  getScreenPixel?: (pixel: Pixel, viewState: ViewState) => Pixel;
  getText?: (text?: string) => string;
  getTextColor?: (type: RealtimeMot, line?: RealtimeLine) => string;
  getTextFont?: (fontSize: number, text?: string) => string;
  getTextSize?: (
    ctx: AnyCanvasContext,
    markerSize: number,
    name: string,
    fontSize: number,
    getFont: (fontSize: number, text?: string) => string,
  ) => number;
  hoverVehicleId?: RealtimeTrainId;
  noInterpolate?: boolean;
  selectedVehicleId?: RealtimeTrainId;
  useDelayStyle?: boolean;
  useHeadingStyle?: boolean;
}

export type RealtimeTrajectories = Record<RealtimeTrainId, RealtimeTrajectory>;

export type RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => AnyCanvas | null;

export interface RealtimeRenderState {
  center?: Coordinate;
  renderedTrajectories?: RealtimeTrajectory[];
  rotation?: number;
  zoom?: number;
}

export type AnyMapGlMap = maplibregl.Map;
export type AnyMapGlMapOptions = maplibregl.MapOptions;
export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type AnyCanvasContext =
  | CanvasRenderingContext2D
  | null
  | OffscreenCanvasRenderingContext2D
  | undefined;

export type AnyRealtimeLayer = MbRealtimeLayer | OlRealtimeLayer;
export type AnyCopyrightControl = MbCopyrightControl | OlCopyrightControl;

export interface LayerGetFeatureInfoResponse {
  coordinate: Coordinate;
  features: Feature[];
  layer: Layer;
}

export interface LayerGetFeatureInfoOptions {
  nb?: number;
  hitTolerance: number;
}

export type RoutingGraph = [RoutingParameters['graph'] | 'osm', number, number];
export type RoutingMot = RoutingParameters['mot'];
export type RoutingViaPoint = Coordinate | string;
