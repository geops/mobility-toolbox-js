/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { Feature, Point } from "geojson";

import type BufferMessage from "./realtime-asyncapi-types/BufferMessage";
import type DeletedVehicleMessage from "./realtime-asyncapi-types/DeletedVehicleMessage";
import type FullTrajectory from "./realtime-asyncapi-types/FullTrajectory";
import type FullTrajectoryCollection from "./realtime-asyncapi-types/FullTrajectoryCollection";
import type FullTrajectoryCollectionProperties from "./realtime-asyncapi-types/FullTrajectoryCollectionProperties";
import type FullTrajectoryMessage from "./realtime-asyncapi-types/FullTrajectoryMessage";
import type FullTrajectoryProperties from "./realtime-asyncapi-types/FullTrajectoryProperties";
import type Line from "./realtime-asyncapi-types/Line";
import type PartialTrajectoryMessage from "./realtime-asyncapi-types/PartialTrajectoryMessage";
import type StopSequence from "./realtime-asyncapi-types/StopSequence";
import type StopSequenceCall from "./realtime-asyncapi-types/StopSequenceCall";
import type StopSequenceMessage from "./realtime-asyncapi-types/StopSequenceMessage";
import type TCallStateEnum from "./realtime-asyncapi-types/TCallStateEnum";
import type TmotCode from "./realtime-asyncapi-types/TmotCode";
import type TrackerTrajectory from "./realtime-asyncapi-types/TrackerTrajectory";
import type TrackerTrajectoryProperties from "./realtime-asyncapi-types/TrackerTrajectoryProperties";
import type TTrainStateEnum from "./realtime-asyncapi-types/TTrainStateEnum";
import type { components } from "./realtimerest";
import type { operations as RestOperations } from "./realtimerest";

type ValueOf<T> = T[keyof T];

enum VersionEnum {
  V1 = "1",
  V2 = "2",
}

type Version = ValueOf<typeof VersionEnum>;

/**
 * @deprecated, use Realtime.Version instead
 */
export type RealtimeVersion = "1" | "2";

enum ChannelModeSuffixEnum {
  SCHEMATIC = "_schematic",
  TOPOGRAPHIC = "",
}

type ChannelModeSuffix = ValueOf<typeof ChannelModeSuffixEnum>;

/**
 * @deprecated, use Realtime.ChannelModeSuffix instead
 */
export declare type RealtimeChannelModeSuffix = ChannelModeSuffix;

enum ModeEnum {
  RAW = "raw",
  SCHEMATIC = "schematic",
  TOPOGRAPHIC = "topographic",
}

type Mode = ValueOf<typeof ModeEnum>;

/**
 * @deprecated, use Realtime.Mode enum instead
 */
export declare type RealtimeMode = Mode;

type TrajectoryCollection = components["schemas"]["TrajectoryCollection"];

type TrainsByRouteIdentifierResult =
  components["schemas"]["TrainsByRouteIdentifierResult"];

/**
 * @deprecated, use Realtime.TrainsByRouteIdentifierResult instead
 */
export type RealtimeTrainsByRouteIdentifierResult =
  TrainsByRouteIdentifierResult;

type RouteIdentifierMatch = components["schemas"]["RouteIdentifierMatch"];

/**
 * @deprecated, use Realtime.IdentifierMatch instead
 */
export type RealtimeIdentifierMatch = RouteIdentifierMatch;

/**
 * @type RealtimeBbox
 */
type Bbox = (number | string)[];

/**
 * @deprecated, use Realtime.Bbox instead
 */
export type RealtimeBbox = Bbox;

type Buffer = [number, number];
/**
 * @deprecated, use Realtime.Buffer instead
 */
export type RealtimeBuffer = [number, number];

/**
 * @deprecated, use Realtime.BufferMessage instead
 */
export type RealtimeBufferResponse = BufferMessage;

type ChannelName =
  | "buffer"
  | "extra_geoms"
  | "healthcheck"
  | "line"
  | "websocket"
  | `deleted_vehicles${ChannelModeSuffix}`
  | `full_trajectory${ChannelModeSuffix}_${Tenant}_${TrainId}`
  | `stopsequence_${Tenant}_${TrainId}`
  | `timetable_${StationId}`
  | `trajectory${ChannelModeSuffix}`;

/**
 * @deprecated, use Realtime.ChannelName instead
 */
export type RealtimeChannelName = ChannelName;

/**
 * @deprecated, use Realtime.DeletedVehicleMessage instead
 */
export type RealtimeDeletedVehiclesResponse = DeletedVehicleMessage;

export interface TimeTableCall {
  aimedArrivalTime?: number;
  aimedDepartureTime?: number;
  arrivalDelay?: number;
  arrivalTime?: number;
  at_station_ds100?: string; // TODO Verify it still exists
  at_stoppoint: string;
  call_id: number;
  changes: unknown[];
  created_at: number;
  departureDelay?: number;
  departureTime?: number;
  formation?: unknown;
  fzo_estimated_time: number;
  has_fzo: boolean;
  has_realtime_journey: boolean;
  journey_start_time?: number;
  line: RealtimeLine;
  min_arrival_time?: number;
  new_to?: boolean; // TODO Verify it still exists
  next_stoppoints: string[];
  no_stop_between?: boolean; // TODO Verify it still exists
  no_stop_till?: unknown; // TODO Verify it still exists
  operator_provides_fzo: boolean;
  platform?: string;
  ris_aimed_time?: number;
  ris_estimated_time?: number;
  state: TCallStateEnum; /// (BOARDING|STOP_CANCELLED|JOURNEY_CANCELLED|HIDDEN)/
  tenant: Tenant;
  time?: number;
  timediff?: number; // TODO Verify it still exists
  timestamp?: number; // TODO Verify it still exists
  to: string[];
  train_id: TrainId;
  train_number?: number;
  train_type?: number;
  updated_at: number;
  vehicle_mode?: string;
}

/**
 * @deprecated use Realtime.TimeTableCall instead
 */
export type RealtimeDeparture = TimeTableCall;

enum ElevatorStateEnum {
  ALL_OPERABLE = "ALL_OPERABLE",
}

type ElevatorState = ValueOf<typeof ElevatorStateEnum>;

/**
 * @deprecated, use Realtime.ElevatorState instead
 */
export type RealtimeElevatorState = ElevatorState;

interface ExtraGeom extends Feature {
  properties: ExtraGeomProperties;
}
/**
 * @deprecated, use Realtime.ExtraGeomDeleted instead
 */
export interface RealtimeExtraGeom extends ExtraGeom {}

interface ExtraGeomDeleted {
  properties: ExtraGeomProperties;
  type: "Deleted";
}
/**
 * @deprecated, use Realtime.ExtraGeomDeleted instead
 */
export interface RealtimeExtraGeomDeleted extends ExtraGeomDeleted {}

interface ExtraGeomProperties {
  ref: number | string;
}

/**
 * @deprecated, use Realtime.ExtraGeomsProperties instead
 */
export interface RealtimeExtraGeomProperties extends ExtraGeomProperties {}

type ExtraGeoms = Record<string, Feature[]>;

/**
 * @deprecated, use Realtime.ExtraGeoms instead
 */
export type RealtimeExtraGeoms = ExtraGeoms;

interface ExtraGeomsMessage {
  client_reference: null;
  content: RealtimeExtraGeom | RealtimeExtraGeomDeleted;
  source: `extra_geoms`;
  timestamp: number;
}

/**
 * @deprecated, use Realtime.ExtraGeomsMessage instead
 */
export interface RealtimeExtraGeomsResponse extends ExtraGeomsMessage {}

type FeedCollection = components["schemas"]["FeedCollection"];

/**
 * @deprecated, use Realtime.RealtimeFeedCollection instead
 */
export type RealtimeFeedCollection = components["schemas"]["FeedCollection"];

type Feed = components["schemas"]["Feed"];

/**
 * @deprecated, use Realtime.Feed instead
 */
export type RealtimeFeed = Feed;

/**
 * @deprecated, use Realtime.FullTrajectoryCollection instead
 */
export type RealtimeFullTrajectoryCollection = FullTrajectoryCollection;

/**
 * @deprecated, use Realtime.FullTrajectory instead
 */
export type RealtimeFullTrajectory = FullTrajectory;

/**
 * @deprecated, use Realtime.FullTrajectoryCollectionProperties instead
 */
export type RealtimeFullTrajectoryCollectionProperties =
  FullTrajectoryCollectionProperties;

/**
 * @deprecated, use Realtime.FullTrajectoryProperties instead
 */
export type RealtimeFullTrajectoryProperties = FullTrajectoryProperties;

interface Health {
  heathly: boolean;
  service: RealtimeService;
  tenant: null | string;
}

/**
 * @deprecated, use Realtime.Health instead
 */
export type RealtimeHealth = Health;

interface HealthCheckMessage {
  client_reference: null;
  content: RealtimeHealth;
  source: "healthcheck";
  timestamp: number;
}
/**
 * @deprecated, use Realtime.HealthCheckMessage instead
 */
export type RealtimeHealthCheckResponse = HealthCheckMessage;

/**
 * @deprecated, use Realtime.Line instead
 */
export type RealtimeLine = Line;

/**
 * @deprecated, use Realtime.TmotCode instead
 */
export type RealtimeMot = TmotCode;

interface News {
  incident_program: boolean;
  messages: NewsMessage[];
}

/**
 * @deprecated, use Realtime.News instead
 */
export interface RealtimeNews extends News {}

interface NewsMessage {
  content: string;
  lines: Line[];
  title: string;
  updated: string; // TODO: ISO string
}

/**
 * @deprecated, use Realtime.NewsMessage instead
 */
export interface RealtimeNewsMessage extends NewsMessage {}

interface NewsTickerMessage {
  client_reference: null;
  content: News;
  source: `${Tenant}_newsticker`;
  timestamp: number;
}

/**
 * @deprecated, use Realtime.NewsTickerMessage instead
 */
export interface RealtimeNewsTickerResponse extends NewsTickerMessage {}

type StationId = number;

/**
 * @deprecated, use Realtime.StationId instead
 */
export type RealtimeStationId = StationId;

enum ServiceEnum {
  REDIS_WEBSOCKET_API = "redis_websocket_api",
  TRALIS_FZO = "tralis_fzo",
  TRALIS_GEOFOX = "tralis_geofox",
  TRALIS_NEWSTICKER = "tralis_newsticker",
  TRALIS_STATIONS = "tralis_stations",
  TRALIS_VDV = "tralis_vdv",
  TRALIS_WORKER = "tralis_worker",
}

type Service = ValueOf<typeof ServiceEnum>;

/**
 * @deprecated, use Realtime.Service instead
 */
export type RealtimeService = Service;

interface Station extends Feature {
  geometry: Point;
  properties: StationProperties;
}

/**
 * @deprecated, use Realtime.Station instead
 */
export interface RealtimeStation extends Station {}

interface StationProperties extends Feature {
  elevatorOutOfOrder: boolean;
  elevators: object;
  elevatorState: ElevatorState;
  hasAccessibility: boolean;
  hasAirport: boolean;
  hasElevator: boolean;
  hasZOB: boolean;
  name: string;
  networkLines: Line[];
  tenant: Tenant;
  transfers: Transfer[];
  uic: StationId;
}

/**
 * @deprecated, use Realtime.StationProperties instead
 */
export interface RealtimeStationproperties extends StationProperties {}

interface StationMessage {
  client_reference: null;
  content: News;
  source: `station_${StationId}`;
  timestamp: number;
}

interface TimetableMessage {
  client_reference: null;
  content: TimeTableCall;
  source: `timetable_${StationId}`;
  timestamp: number;
}

/**
 * @deprecated, use Realtime.StationMessage instead
 */

export interface RealtimeStationMessage extends StationMessage {}

/**
 * @deprecated, use Realtime.StopSequenceCall instead
 */
export type RealtimeStop = StopSequenceCall;

/**
 * @deprecated, use Realtime.StopSequence instead
 */
export type RealtimeStopSequence = StopSequence;

/**
 * @deprecated, use Realtime.StopSequenceMessage instead
 */
export type RealtimeStopSequenceMessage = StopSequenceMessage;

/**
 * @deprecated, use Realtime.TCallStateEnum instead
 */
export type RealtimeStopState = TCallStateEnum;

enum TenantEnum {
  EMPTY = "",
  SBB = "sbb",
  SBH = "sbh",
  SBM = "sbm",
}

type Tenant = ValueOf<typeof TenantEnum>;

/**
 * @deprecated, use Realtime.Tenant instead
 */
export type RealtimeTenant = Tenant;

/**
 * @deprecated, use Realtime.TimetableResponse instead
 */

export interface RealtimeTimetableResponse extends TimetableMessage {}

type TrainId = string;

/**
 * @deprecated, use Realtime.TimetableResponse instead
 */
export type RealtimeTrainId = TrainId;

/**
 * @deprecated, use Realtime.PartialTrajectoryMessage instead
 */
export type RealtimeTrajectoryResponse = PartialTrajectoryMessage;

/**
 * @deprecated, use Realtime.TTrainStateEnum instead
 */
export type RealtimeTrajectoryState = TTrainStateEnum;

// export type RealtimeTrajectoryProperties = {
//   cancelled: boolean; // to chekc if it commes from backend or if it is generated by the RealtimeAPI class
//   coordinate?: number[]; // Prop added when rendered on the map, not in the backend response
//   rotation?: null | number; // Prop added when rendered on the map, not in the backend response
// } & TrackerTrajectoryProperties;

/**
 * @deprecated, use Realtime.TrackerTrajectory instead
 */
export type RealtimeTrajectory = TrackerTrajectory;

interface Transfer {
  lines: string[];
  mot: TmotCode;
}
export interface RealtimeTransfer extends Transfer {}

type TCallState = ValueOf<typeof TCallStateEnum>;
type TTrainState = ValueOf<typeof TTrainStateEnum>;

export {
  Bbox,
  Buffer,
  BufferMessage,
  ChannelModeSuffix,
  ChannelModeSuffixEnum,
  ChannelName,
  DeletedVehicleMessage,
  ElevatorState,
  ElevatorStateEnum,
  ExtraGeom,
  ExtraGeomDeleted,
  ExtraGeomProperties,
  ExtraGeoms,
  ExtraGeomsMessage,
  Feed,
  FeedCollection,
  FullTrajectory,
  FullTrajectoryCollection,
  FullTrajectoryCollectionProperties,
  FullTrajectoryMessage,
  FullTrajectoryProperties,
  Health,
  HealthCheckMessage,
  Line,
  Mode,
  ModeEnum,
  News,
  NewsMessage,
  NewsTickerMessage,
  PartialTrajectoryMessage,
  RestOperations,
  RouteIdentifierMatch,
  Service,
  ServiceEnum,
  Station,
  StationId,
  StationMessage,
  StationProperties,
  StopSequence,
  StopSequenceCall,
  StopSequenceMessage,
  TCallState,
  TCallStateEnum,
  Tenant,
  TenantEnum,
  TimetableMessage,
  TmotCode,
  TrackerTrajectory,
  TrackerTrajectoryProperties,
  TrainId,
  TrainsByRouteIdentifierResult,
  TrajectoryCollection,
  Transfer,
  TTrainState,
  TTrainStateEnum,
  Version,
  VersionEnum,
};
