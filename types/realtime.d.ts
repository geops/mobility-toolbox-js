import { FeatureCollection, Feature } from 'geojson';

export type RealtimeTrainId = string;

export type RealtimeTenant = 'sbb' | 'sbh' | 'sbm' | '' | string;

export type RealtimeGeneralizationLevel = 5 | 10 | 30 | 100;

export type RealtimeMots =
  | 'tram'
  | 'subway'
  | 'rail'
  | 'bus'
  | 'ferry'
  | 'cablecar'
  | 'gondola'
  | 'funicular'
  | 'coach';

// "full_trajectory_sbb_140494499865208"
export type RealtimeFullTrajectoryChannelName =
  | `full_trajectory_${RealtimeTenant}_${number}`
  | `full_trajectory_schematic_${RealtimeTenant}_${number}`;

// "stopsequence_sbm_140427893584280"
export type RealtimeStopSequenceChannelName =
  | `stopsequence_${RealtimeTenant}_${number}`;

// "timetable_8002491"
export type RealtimeTimetableChannelName = `timetable_${number}`;

export type RealtimeChannelName =
  | 'websocket'
  | 'buffer'
  | 'trajectory'
  | 'trajectory_schematic'
  | 'deleted_vehicles'
  | 'deleted_vehicles_schematic'
  | 'line'
  | RealtimeFullTrajectoryChannelName
  | RealtimeStopSequenceChannelName
  | RealtimeTimetableChannelName;

export type RealtimeWebsocketChannelResponse = {
  status?: 'open' | 'closed' | 'error';
  info?: string;
};

export interface RealtimeResponse {
  source: string; // RealtimeChannelName;
  timestamp: number;
  client_reference: null | '';
  content:
    | RealtimeResponse[]
    | RealtimeWebsocketChannelResponse
    | FeatureCollection
    | Feature
    | RealtimeTrainId
    | null;
}

export interface RealtimeLine {
  id: number;
  name?: string;
  color?: string;
  text_color?: string;
  stroke?: string;
}

export interface RealtimeTrajectory {
  bounds: [number, number, number, number];
  delay?: number;
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
  routeIdentifier: string;
  state: 'HIDDEN' | 'BOARDING' | 'STOP_CANCELLED' | 'JOURNEY_CANCELLED';
  tenant: string;
  time_intervals?: Array<Array<number>>;
  time_since_update?: string;
  timestamp: number;
  train_id?: RealtimeTrainId;
  train_number?: number;
  type: RealtimeMots;
}

export interface RealtimeFullTrajectory {
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
