import type Line from './Line';
import type OperatorProvidesRealtimeJourney from './OperatorProvidesRealtimeJourney';
import type TmotCode from './TmotCode';
import type TTrainStateEnum from './TTrainStateEnum';
interface TrackerTrajectoryProperties {
  additionalProperties?: Map<string, unknown>;
  bounds: number[];
  delay?: null | number;
  event_timestamp?: null | number;
  gen_level: null | number;
  gen_range: number[];
  graph: string;
  has_journey: boolean;
  has_realtime: boolean;
  has_realtime_journey: boolean;
  line?: Line | null;
  operator_provides_realtime_journey: OperatorProvidesRealtimeJourney;
  route_identifier?: null | string;
  state?: null | TTrainStateEnum;
  tenant: string;
  time_intervals: (null | number)[][];
  time_since_update?: null | number;
  timestamp: number;
  train_id: string;
  type: TmotCode;
}
export default TrackerTrajectoryProperties;
