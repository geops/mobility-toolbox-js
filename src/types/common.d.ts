import type { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Pixel } from 'ol/pixel';

import type {
  CopyrightControl as MbCopyrightControl,
  RealtimeLayer as MbRealtimeLayer,
} from '../maplibre';
import type {
  CopyrightControl as OlCopyrightControl,
  RealtimeLayer as OlRealtimeLayer,
} from '../ol';

import type { RealtimeTrainId, RealtimeTrajectory } from './realtime';

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
  visible?: boolean;
  zoom?: number;
}

export interface RealtimeStyleOptions {
  delayDisplay: number;
  delayOutlineColor: string;
  filter?: FilterFunction;
  getArrowSize: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    radius: number,
  ) => number[];
  getColor: (trajectory?: RealtimeTrajectory, viewState?: ViewState) => string;
  getDelayColor: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    delay: null | number,
    cancelled?: boolean,
    isDelayText?: boolean,
  ) => string;
  getDelayFont: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    fontSize: number,
    text?: string,
  ) => string;
  getDelayText: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    delay?: number,
    cancelled?: boolean,
  ) => string;
  getDelayTextColor: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    delay?: null | number,
    cancelled?: boolean,
  ) => string;
  getImage: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    text: string,
    radius: number,
  ) => AnyCanvas | null;
  getMaxRadiusForStrokeAndDelay: () => number;
  getMaxRadiusForText: () => number;
  getRadius: (trajectory?: RealtimeTrajectory, viewState?: ViewState) => number;
  getScreenPixel?: (pixel: Pixel, viewState?: ViewState) => Pixel;
  getText: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    text?: string,
  ) => string;
  getTextColor: (
    trajectory: RealtimeTrajectory,
    viewState: ViewState,
  ) => string;
  getTextFont: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    fontSize: number,
    text?: string,
  ) => string;
  getTextSize: (
    trajectory?: RealtimeTrajectory,
    viewState?: ViewState,
    ctx: AnyCanvasContext,
    markerSize: number,
    name: string,
    fontSize: number,
    font: string,
  ) => number;
  hoverVehicleId?: RealtimeTrainId;
  noInterpolate?: boolean;
  selectedVehicleId?: RealtimeTrainId;
  showDelayBg: boolean;
  showDelayText: boolean;
  showHeading: boolean;
  useDelayStyle: boolean;
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
  hitTolerance: number;
  nb?: number;
}

export type RoutingGraph = ['osm' | RoutingParameters['graph'], number, number];
export type RoutingMot = RoutingParameters['mot'];
export type RoutingViaPoint = Coordinate | string;
