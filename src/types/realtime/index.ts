/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { Feature, Point } from "geojson";
export * from "./asyncapi";
import type BufferMessage from "./asyncapi/BufferMessage";
import type DeletedVehicleMessage from "./asyncapi/DeletedVehicleMessage";
import type Line from "./asyncapi/Line";
import type PartialTrajectoryMessage from "./asyncapi/PartialTrajectoryMessage";
import type StopSequenceCall from "./asyncapi/StopSequenceCall";
import type TCallStateEnum from "./asyncapi/TCallStateEnum";
import type TmotCode from "./asyncapi/TmotCode";
import type TrackerTrajectory from "./asyncapi/TrackerTrajectory";
import type TTrainStateEnum from "./asyncapi/TTrainStateEnum";
import type { components } from "./rest";
export * from "./rest";

export type ValueOf<T> = T[keyof T];

export enum VersionEnum {
  V1 = "1",
  V2 = "2",
}

export type Version = ValueOf<typeof VersionEnum>;

export enum ChannelModeSuffixEnum {
  SCHEMATIC = "_schematic",
  TOPOGRAPHIC = "",
}

export type ChannelModeSuffix = ValueOf<typeof ChannelModeSuffixEnum>;

/**
 * @deprecated, use Realtime.ChannelModeSuffix instead
 */
export declare type RealtimeChannelModeSuffix = ChannelModeSuffix;

export enum ModeEnum {
  RAW = "raw",
  SCHEMATIC = "schematic",
  TOPOGRAPHIC = "topographic",
}

export type Mode = ValueOf<typeof ModeEnum>;

export type TrajectoryCollection =
  components["schemas"]["TrajectoryCollection"];

export type TrainsByRouteIdentifierResult =
  components["schemas"]["TrainsByRouteIdentifierResult"];

export type RouteIdentifierMatch =
  components["schemas"]["RouteIdentifierMatch"];

/**
 * @type RealtimeBbox
 */
export type Bbox = (number | string)[];

export type Buffer = [number, number];

/**
 * @deprecated, use Realtime.BufferMessage instead
 */
export type RealtimeBufferResponse = BufferMessage;

export type ChannelName =
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
 * @deprecated, use Realtime.DeletedVehicleMessage instead
 */
export type DeletedVehiclesResponse = DeletedVehicleMessage;

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
  line: Line;
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
export type Departure = TimeTableCall;

export enum ElevatorStateEnum {
  ALL_OPERABLE = "ALL_OPERABLE",
}

export type ElevatorState = ValueOf<typeof ElevatorStateEnum>;

export interface ExtraGeom extends Feature {
  properties: ExtraGeomProperties;
}

export interface ExtraGeomDeleted {
  properties: ExtraGeomProperties;
  type: "Deleted";
}

export interface ExtraGeomProperties {
  ref: number | string;
}

export type ExtraGeoms = Record<string, Feature[]>;

export interface ExtraGeomsMessage {
  client_reference: null;
  content: ExtraGeom | ExtraGeomDeleted;
  source: `extra_geoms`;
  timestamp: number;
}

/**
 * @deprecated, use Realtime.ExtraGeomsMessage instead
 */
export interface ExtraGeomsResponse extends ExtraGeomsMessage {}

export type FeedCollection = components["schemas"]["FeedCollection"];

export type Feed = components["schemas"]["Feed"];

export interface Health {
  heathly: boolean;
  service: Service;
  tenant: null | string;
}

export interface HealthCheckMessage {
  client_reference: null;
  content: Health;
  source: "healthcheck";
  timestamp: number;
}
/**
 * @deprecated, use Realtime.HealthCheckMessage instead
 */
export type HealthCheckResponse = HealthCheckMessage;

/**
 * @deprecated, use Realtime.TmotCode instead
 */
export type Mot = TmotCode;

export interface News {
  incident_program: boolean;
  messages: NewsMessage[];
}

export interface NewsMessage {
  content: string;
  lines: Line[];
  title: string;
  updated: string; // TODO: ISO string
}

export interface NewsTickerMessage {
  client_reference: null;
  content: News;
  source: `${Tenant}_newsticker`;
  timestamp: number;
}

/**
 * @deprecated, use Realtime.NewsTickerMessage instead
 */
export interface NewsTickerResponse extends NewsTickerMessage {}

export type StationId = number;

export enum ServiceEnum {
  REDIS_WEBSOCKET_API = "redis_websocket_api",
  TRALIS_FZO = "tralis_fzo",
  TRALIS_GEOFOX = "tralis_geofox",
  TRALIS_NEWSTICKER = "tralis_newsticker",
  TRALIS_STATIONS = "tralis_stations",
  TRALIS_VDV = "tralis_vdv",
  TRALIS_WORKER = "tralis_worker",
}

export type Service = ValueOf<typeof ServiceEnum>;

export interface Station extends Feature {
  geometry: Point;
  properties: StationProperties;
}

export interface StationProperties extends Feature {
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

export interface StationMessage {
  client_reference: null;
  content: News;
  source: `station_${StationId}`;
  timestamp: number;
}

export interface TimetableMessage {
  client_reference: null;
  content: TimeTableCall;
  source: `timetable_${StationId}`;
  timestamp: number;
}

/**
 * @deprecated, use Realtime.StopSequenceCall instead
 */
export type Stop = StopSequenceCall;

/**
 * @deprecated, use Realtime.TCallStateEnum instead
 */
export type StopState = TCallStateEnum;

export enum TenantEnum {
  EMPTY = "",
  SBB = "sbb",
  SBH = "sbh",
  SBM = "sbm",
}

export type Tenant = ValueOf<typeof TenantEnum>;

/**
 * @deprecated, use Realtime.TimetableResponse instead
 */

export interface TimetableResponse extends TimetableMessage {}

export type TrainId = string;

/**
 * @deprecated, use Realtime.PartialTrajectoryMessage instead
 */
export type TrajectoryResponse = PartialTrajectoryMessage;

/**
 * @deprecated, use Realtime.TTrainStateEnum instead
 */
export type TrajectoryState = TTrainStateEnum;

// export type RealtimeTrajectoryProperties = {
//   cancelled: boolean; // to chekc if it commes from backend or if it is generated by the RealtimeAPI class
//   coordinate?: number[]; // Prop added when rendered on the map, not in the backend response
//   rotation?: null | number; // Prop added when rendered on the map, not in the backend response
// } & TrackerTrajectoryProperties;

/**
 * @deprecated, use Realtime.TrackerTrajectory instead
 */
export type Trajectory = TrackerTrajectory;

export interface Transfer {
  lines: string[];
  mot: TmotCode;
}

export type TCallState = ValueOf<typeof TCallStateEnum>;
export type TTrainState = ValueOf<typeof TTrainStateEnum>;
