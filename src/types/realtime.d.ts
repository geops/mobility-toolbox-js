import { Feature, FeatureCollection, Point } from 'geojson';

export declare type RealtimeMode = 'topographic' | 'schematic' | 'raw';

export declare type RealtimeChannelModeSuffix = '' | '_schematic';

export type RealtimeTrainId = string;

export type RealtimeStationId = number;

export type RealtimeService =
  | 'redis_websocket_api'
  | 'tralis_stations'
  | 'tralis_fzo'
  | 'tralis_worker'
  | 'tralis_vdv'
  | 'tralis_newsticker'
  | 'tralis_geofox'
  | string;

export type RealtimeTenant = 'sbb' | 'sbh' | 'sbm' | '' | string;

export type RealtimeElevatorState = 'ALL_OPERABLE' | string;

export type RealtimeStopState = 'LEAVING' | 'BOARDING' | string;

export type RealtimeTrajectoryState =
  | 'HIDDEN'
  | 'BOARDING'
  | 'STOP_CANCELLED'
  | 'JOURNEY_CANCELLED';

export type RealtimeGeneralizationLevel = 5 | 10 | 30 | 100;

export type RealtimeMot =
  | 'tram'
  | 'subway'
  | 'rail'
  | 'bus'
  | 'ferry'
  | 'cablecar'
  | 'gondola'
  | 'funicular'
  | 'coach';

export type RealtimeChannelName =
  | 'websocket'
  | 'buffer'
  | 'line'
  | 'extra_geoms'
  | 'healthcheck'
  | `timetable_${RealtimeStationId}`
  | `trajectory${RealtimeChannelModeSuffix}`
  | `deleted_vehicles${RealtimeChannelModeSuffix}`
  | `stopsequence_${RealtimeTenant}_${RealtimeTrainId}`
  | `full_trajectory${RealtimeChannelModeSuffix}_${RealtimeTenant}_${RealtimeTrainId}`;

export interface RealtimeTrajectoryProperties {
  // Tralis and trafimage
  bounds: [number, number, number, number];
  delay: number | null;
  event_timestamp: number;
  gen_level?: RealtimeGeneralizationLevel;
  gen_range: [number, number];
  has_journey: boolean;
  has_realtime: boolean;
  has_realtime_journey: boolean;
  line?: RealtimeLine;
  operator_provides_realtime_journey: 'unknown' | 'yes' | 'no';
  rake?: string;
  raw_time?: string;
  route_identifier: string;
  state: RealtimeTrajectoryState;
  tenant: string;
  time_intervals?: Array<Array<number>>;
  time_since_update?: string;
  timestamp: number;
  train_id?: RealtimeTrainId;
  train_number?: number;
  type: RealtimeMots;

  operator?: string; // deprecated, operator is an old property, use tenant instead.
  name?: string; // deprecated, name is an old property, use line.name instead.

  // Tralis
  event?: string;
  event_delay?: number;
  event_timestamp?: number;
  original_line?: RealtimeLine;
  original_rake?: string;
  original_train_number?: number;
  position_correction?: number;
  raw_coordinates?: [number, number];
  ride_state?: string;
  routeIdentifier?: string;
  transmitting_vehicle?: string;
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
  cancelled: booblean;
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
  ref: string | number;
}

export interface RealtimeExtraGeom extends Feature {
  properties: RealtimeExtraGeomProperties;
}

export interface RealtimeExtraGeomDeleted {
  type: 'Deleted';
  properties: RealtimeExtraGeomProperties;
}

export type RealtimeExtraGeoms = {
  [index: string]: Feature[];
};

export interface RealtimeLine {
  id: number;
  color: string;
  stroke: string;
  name: string;
  text_color: string;
}

export interface RealtimeTransfer {
  mot: RealtimeMot;
  lines: string[];
}

export interface RealtimeStationproperties extends Feature {
  transfers: RealtimeTransfer[];
  elevatorOutOfOrder: boolean;
  elevatorState: RealtimeElevatorState;
  elevators: object;
  uic: RealtimeStationId;
  name: string;
  networkLines: RealtimeLine[];
  hasElevator: boolean;
  hasZOB: boolean;
  hasAccessibility: boolean;
  hasAirport: boolean;
  tenant: RealtimeTenant;
}

export interface RealtimeStation extends Feature {
  geometry: Point;
  properties: RealtimeStationproperties;
}

export interface RealtimeDeparture {
  to: string[];
  time: number;
  no_stop_between: boolean;
  new_to: boolean;
  has_fzo: boolean;
  next_stoppoints: string[];
  platform: string;
  created_at: string;
  at_station_ds100: string;
  train_number: number;
  ris_aimed_time: number;
  updated_at: number;
  min_arrival_time: number;
  ris_estimated_time: number;
  train_id: RealtimeTrainId;
  fzo_estimated_time: number;
  train_type: number;
  call_id: number;
  line: RealtimeLine;
  state: string; /// (BOARDING|STOP_CANCELLED|JOURNEY_CANCELLED|HIDDEN)/
  formation: any;
  no_stop_till: any;
  timestamp: number; // This property seems to never exists
  timediff: number; // This property seems to alawy been 0
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
  tenant: string | null;
}

export interface RealtimeExtraGeomsResponse {
  source: `extra_geoms`;
  timestamp: number;
  client_reference: null;
  content: RealtimeExtraGeom | RealtimeExtraGeomDeleted;
}

export interface RealtimeStationResponse {
  source: `station_${RealtimeStationId}`;
  timestamp: number;
  client_reference: null;
  content: RealtimeNews;
}

export interface RealtimeNewsTickerResponse {
  source: `${RealtimeTenant}_newsticker`;
  timestamp: number;
  client_reference: null;
  content: RealtimeNews;
}

export interface RealtimeTimetableResponse {
  source: `timetable_${RealtimeStationId}`;
  timestamp: number;
  client_reference: null;
  content: RealtimeDeparture;
}

export interface RealtimeTrajectoryResponse {
  source: `trajectory${RealtimeChannelModeSuffix}`;
  timestamp: number;
  client_reference: '';
  content: RealtimeTrajectory;
}

export interface RealtimeStopSequenceResponse {
  source: `stopsequence_${RealtimeTenant}_${RealtimeTrainId}`;
  timestamp: number;
  client_reference: '';
  content: Array<RealtimeStopSequence>;
}

export interface RealtimeBufferResponse {
  source: 'buffer';
  timestamp: number;
  client_reference: '';
  content: RealtimeTrajectoryResponse[];
}

export interface RealtimeDeletedVehiclesResponse {
  source: `deleted_vehicles${RealtimeChannelModeSuffix}`;
  timestamp: number;
  client_reference: null;
  content: string;
}

export interface RealtimeHealthCheckResponse {
  source: 'healthcheck';
  timestamp: number;
  client_reference: null;
  content: RealtimeHealth;
}
