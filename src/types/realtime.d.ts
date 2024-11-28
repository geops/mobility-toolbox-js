import { Feature, FeatureCollection, Point } from 'geojson';

export declare type RealtimeMode = 'raw' | 'schematic' | 'topographic';

export declare type RealtimeChannelModeSuffix = '_schematic' | '';

export type RealtimeTrainId = string;

export type RealtimeStationId = number;

export type RealtimeService =
  | 'redis_websocket_api'
  | 'tralis_fzo'
  | 'tralis_geofox'
  | 'tralis_newsticker'
  | 'tralis_stations'
  | 'tralis_vdv'
  | 'tralis_worker'
  | string;

export type RealtimeTenant = '' | 'sbb' | 'sbh' | 'sbm' | string;

export type RealtimeElevatorState = 'ALL_OPERABLE' | string;

export type RealtimeStopState = 'BOARDING' | 'LEAVING' | string;

export type RealtimeTrajectoryState =
  | 'BOARDING'
  | 'HIDDEN'
  | 'JOURNEY_CANCELLED'
  | 'STOP_CANCELLED';

export type RealtimeGeneralizationLevel = 10 | 100 | 30 | 5;

export type RealtimeMot =
  | 'bus'
  | 'cablecar'
  | 'coach'
  | 'ferry'
  | 'funicular'
  | 'gondola'
  | 'rail'
  | 'subway'
  | 'tram';

/**
 * @type RealtimeBbox
 */
export type RealtimeBbox = (number | string)[];
// minX: number,
// minY: number,
// maxX: number,
// maxY: number,
// zoom: number,
// string?,
// `gen_level=${RealtimeGeneralizationLevel}`| undefined,
// `tenant=${UnionConcat<RealtimeTenant, ','>}`!,
// `mots=${UnionConcat<RealtimeMot, ','>}`!,

export type RealtimeBuffer = [number, number];

export type RealtimeChannelName =
  | 'buffer'
  | 'extra_geoms'
  | 'healthcheck'
  | 'line'
  | 'websocket'
  | `deleted_vehicles${RealtimeChannelModeSuffix}`
  | `full_trajectory${RealtimeChannelModeSuffix}_${RealtimeTenant}_${RealtimeTrainId}`
  | `stopsequence_${RealtimeTenant}_${RealtimeTrainId}`
  | `timetable_${RealtimeStationId}`
  | `trajectory${RealtimeChannelModeSuffix}`;

export interface RealtimeTrajectoryProperties {
  // Tralis and trafimage
  bounds: [number, number, number, number];

  // Only after first rendering on a map
  coordinate?: [number, number];

  delay: null | number;

  // Tralis
  event?: string;
  event_delay?: number;
  event_timestamp: number;
  event_timestamp?: number;
  gen_level?: RealtimeGeneralizationLevel;
  gen_range: [number, number];
  has_journey: boolean;
  has_realtime: boolean;
  has_realtime_journey: boolean;
  line?: RealtimeLine;
  name?: string; // deprecated, name is an old property, use line.name instead.
  operator?: string; // deprecated, operator is an old property, use tenant instead.
  operator_provides_realtime_journey: 'no' | 'unknown' | 'yes';
  original_line?: RealtimeLine;
  original_rake?: string;
  original_train_number?: number;
  position_correction?: number;
  rake?: string;
  raw_coordinates?: [number, number];

  raw_time?: string;
  ride_state?: string;

  route_identifier: string;
  routeIdentifier?: string;
  state: RealtimeTrajectoryState;
  tenant: string;
  time_intervals?: number[][];
  time_since_update?: string;
  timestamp: number;
  train_id?: RealtimeTrainId;
  train_number?: number;
  transmitting_vehicle?: string;
  type: RealtimeMots;
}

export interface RealtimeTrajectory extends Feature {
  properties: RealtimeTrajectoryProperties;
}

export interface RealtimeFullTrajectoryProperties {
  gen_level?: RealtimeGeneralizationLevel;
  gen_range: [number, number];
  license?: string;
  licenseNote?: string;
  licenseUrl?: string;
  operator?: string;
  operatorUrl?: string;
  publisher?: string;
  publisherUrl?: string;
  tenant: RealtimeTenant;
  train_id: RealtimeTrainId;
}

export interface RealtimeFullTrajectory extends FeatureCollection {
  properties: RealtimeFullTrajectoryProperties;
}

export interface RealtimeStop {
  aimedArrivalTime: number;
  aimedDepartureTime: number;
  arrivalDelay?: number;
  arrivalTime: number;
  cancelled: boolean;
  coordinate: number[];
  departureDelay: number;
  departureTime: number;
  noDropOff?: boolean;
  noPickUp?: boolean;
  state?: RealtimeStopState;
  stationId: RealtimeStationId;
  stationName: string;
}

export interface RealtimeStopSequence {
  backgroundColor?: string;
  color?: string;
  destination: string;
  id: RealtimeTrainId;
  license?: string;
  licenseNote?: string;
  licenseUrl?: string;
  longName?: string;
  new_destination?: string;
  operator?: string;
  operatorUrl?: string;
  publisher?: string;
  publisherUrl?: string;
  routeIdentifier: string;
  shortName: string;
  stations: RealtimeStop[];
  stroke?: strinealtimeTenant;
  text_color: string;
  type: RealtimeMot;
  vehicleType: number;
}

export interface RealtimeExtraGeomProperties {
  ref: number | string;
}

export interface RealtimeExtraGeom extends Feature {
  properties: RealtimeExtraGeomProperties;
}

export interface RealtimeExtraGeomDeleted {
  properties: RealtimeExtraGeomProperties;
  type: 'Deleted';
}

export type RealtimeExtraGeoms = Record<string, Feature[]>;

export interface RealtimeLine {
  color: string;
  id: number;
  name: string;
  stroke: string;
  text_color: string;
}

export interface RealtimeTransfer {
  lines: string[];
  mot: RealtimeMot;
}

export interface RealtimeStationproperties extends Feature {
  elevatorOutOfOrder: boolean;
  elevators: object;
  elevatorState: RealtimeElevatorState;
  hasAccessibility: boolean;
  hasAirport: boolean;
  hasElevator: boolean;
  hasZOB: boolean;
  name: string;
  networkLines: RealtimeLine[];
  tenant: RealtimeTenant;
  transfers: RealtimeTransfer[];
  uic: RealtimeStationId;
}

export interface RealtimeStation extends Feature {
  geometry: Point;
  properties: RealtimeStationproperties;
}

export interface RealtimeDeparture {
  at_station_ds100: string;
  call_id: number;
  created_at: string;
  formation: any;
  fzo_estimated_time: number;
  has_fzo: boolean;
  line: RealtimeLine;
  min_arrival_time: number;
  new_to: boolean;
  next_stoppoints: string[];
  no_stop_between: boolean;
  no_stop_till: any;
  platform: string;
  ris_aimed_time: number;
  ris_estimated_time: number;
  state: string; /// (BOARDING|STOP_CANCELLED|JOURNEY_CANCELLED|HIDDEN)/
  time: number;
  timediff: number; // This property seems to alawy been 0
  timestamp: number; // This property seems to never exists
  to: string[];
  train_id: RealtimeTrainId;
  train_number: number;
  train_type: number;
  updated_at: number;
}

export interface RealtimeDepartureExtended extends RealtimeDeparture {
  cancelled?: boolean; // value generated by RealtimeAPI class
}

export interface RealtimeNewsMessage {
  content: string;
  lines: RealtimeLine[];
  title: string;
  updated: string; // TODO: ISO string
}

export interface RealtimeNews {
  incident_program: boolean;
  messages: RealtimeNewsMessage[];
}

export interface RealtimeHealth {
  heathly: boolean;
  service: RealtimeService;
  tenant: null | string;
}

export interface RealtimeExtraGeomsResponse {
  client_reference: null;
  content: RealtimeExtraGeom | RealtimeExtraGeomDeleted;
  source: `extra_geoms`;
  timestamp: number;
}

export interface RealtimeStationResponse {
  client_reference: null;
  content: RealtimeNews;
  source: `station_${RealtimeStationId}`;
  timestamp: number;
}

export interface RealtimeNewsTickerResponse {
  client_reference: null;
  content: RealtimeNews;
  source: `${RealtimeTenant}_newsticker`;
  timestamp: number;
}

export interface RealtimeTimetableResponse {
  client_reference: null;
  content: RealtimeDeparture;
  source: `timetable_${RealtimeStationId}`;
  timestamp: number;
}

export interface RealtimeTrajectoryResponse {
  client_reference: '';
  content: RealtimeTrajectory;
  source: `trajectory${RealtimeChannelModeSuffix}`;
  timestamp: number;
}

export interface RealtimeStopSequenceResponse {
  client_reference: '';
  content: RealtimeStopSequence[];
  source: `stopsequence_${RealtimeTenant}_${RealtimeTrainId}`;
  timestamp: number;
}

export interface RealtimeBufferResponse {
  client_reference: '';
  content: RealtimeTrajectoryResponse[];
  source: 'buffer';
  timestamp: number;
}

export interface RealtimeDeletedVehiclesResponse {
  client_reference: null;
  content: string;
  source: `deleted_vehicles${RealtimeChannelModeSuffix}`;
  timestamp: number;
}

export interface RealtimeHealthCheckResponse {
  client_reference: null;
  content: RealtimeHealth;
  source: 'healthcheck';
  timestamp: number;
}
