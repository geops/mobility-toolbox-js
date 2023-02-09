import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { Pixel } from 'ol/pixel';
import type { RealtimeMot, RealtimeTrainId } from './realtime';
import type {
  CopyrightControl as MbCopyrightControl,
  RealtimeLayer as MbRealtimeLayer,
  layer as MbLayer,
} from '../mapbox';
import type {
  CopyrightControl as OlCopyrightControl,
  MapboxLayer,
  MaplibreLayer,
  RealtimeLayer as OlRealtimeLayer,
  layer as OlLayer,
} from '../ol';
import { RealtimeTrajectory } from '../api/typedefs';
import CommonLayer, { LayerCommonOptions } from '../common/layers/LayerCommon';
import type { RoutingParameters } from '.';

export type StyleCache = { [key: string]: AnyCanvas };

export type ViewState = {
  time?: number;
  center?: number[];
  extent?: number[];
  size?: number[];
  rotation?: number;
  resolution?: number;
  zoom?: number;
  pixelRatio?: number;
};

export type RealtimeStyleOptions = {
  hoverVehicleId?: RealtimeTrainId;
  selectedVehicleId?: RealtimeTrainId;
  useDelayStyle?: boolean;
  delayOutlineColor?: string;
  delayDisplay?: number;
  noInterpolate?: boolean;
  filter?: FilterFunction;
  getRadius?: (type: RealtimeMot, z: number) => number;
  getBgColor?: (type: RealtimeMot) => string;
  getDelayColor?: (
    delay: number | null,
    cancelled?: boolean,
    isDelayText?: boolean,
  ) => string;
  getDelayText?: (delay: number | null, cancelled?: boolean) => string;
  getTextColor?: (type: RealtimeMot) => string;
  getTextSize?: (
    ctx: AnyCanvasContext,
    markerSize: number,
    name: string,
    fontSize: number,
  ) => number;
  getMaxRadiusForText?: () => number;
  getMaxRadiusForStrokeAndDelay?: () => number;
  getScreenPixel?: (pixel: Pixel, viewState: ViewState) => Pixel;
};

export type RealtimeTrajectories = {
  [key: RealtimeTrainId]: RealtimeTrajectory;
};

export type RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => AnyCanvas | null;

export type RealtimeRenderState = {
  center?: Coordinate;
  zoom?: number;
  rotation?: number;
  renderedTrajectories?: RealtimeTrajectory[];
};

export type AnyMap = OlMap | MaplibreMap | MapboxMap;
export type AnyLayer = OlLayer | MbLayer;
export type AnyOlLayer = OlLayer;
export type AnyMapboxLayer = MapboxLayer | MaplibreLayer;
export type AnyRealtimeLayer = MbRealtimeLayer | OlRealtimeLayer;
export type AnyCopyrightControl = MbCopyrightControl | OlCopyrightControl;
export type AnyMapboxMap = mapboxgl.Map | maplibregl.Map;
export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type AnyCanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;
export type GConstructor<T extends CommonLayer> = new (options?: any) => T;
export type CommonLayerClass = GConstructor<CommonLayer>;
export type GConstructor2<T extends OlLayer> = new (options?: any) => T;
export type OlLayerClass = GConstructor<AnyOlLayer>;
export type AnyLayerClass = GConstructor<AnyLayer>;

export type AnyMapboxLayerClass = GConstructor<AnyMapboxLayer>;
export type AnyRealtimeLayerClass = GConstructor<AnyRealtimeLayer>;
export type AnyMapboxMapClass = GConstructor<AnyMapboxMap>;
export type AnyCopyrightControlClass = GConstructor<AnyCopyrightControl>;

export type LayerGetFeatureInfoResponse = {
  layer: Layer;
  features: Feature[];
  coordinate: Coordinate;
};

export type LayerGetFeatureInfoOptions = {
  resolution: number;
  nb?: number;
};

export type UserInteractionCallback = (
  features: Feature[],
  layer: LayerCommonOptions,
  coordinate: Coordinate,
  event: ObjectEvent,
) => void;

export type RoutingGraph = [RoutingParameters.graph, number, number];
export type RoutingMot = RoutingParameters.mot;
export type RoutingViaPoint = string | Coordinate;
