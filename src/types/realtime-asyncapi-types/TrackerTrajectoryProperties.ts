import type AnonymousSchema_65 from './AnonymousSchema_65';
import type Line from './Line';
import type OperatorProvidesRealtimeJourney from './OperatorProvidesRealtimeJourney';
import type ReservedType from './ReservedType';
interface TrackerTrajectoryProperties {
  additionalProperties?: Map<string, any>;
  bounds: number[];
  delay?: null | number;
  event_timestamp?: null | number;
  gen_level?: null | number;
  gen_range: number[];
  graph: null | string;
  has_journey: boolean;
  has_realtime: boolean;
  has_realtime_journey: boolean;
  line?: Line | null;
  operator_provides_realtime_journey: OperatorProvidesRealtimeJourney;
  route_identifier?: null | string;
  state?: AnonymousSchema_65 | null;
  tenant: string;
  time_intervals: (null | number)[][];
  time_since_update?: null | number;
  timestamp: number;
  train_id: string;
  type: ReservedType;
}
export default TrackerTrajectoryProperties;
