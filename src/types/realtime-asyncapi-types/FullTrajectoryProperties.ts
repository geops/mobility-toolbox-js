import type TmotCode from './TmotCode';
interface FullTrajectoryProperties {
  additionalProperties?: Map<string, any>;
  event_timestamp?: null | number;
  gen_level: null | number;
  gen_range: number[];
  graph: string;
  journey_id: number;
  line_id: number;
  line_name?: null | string;
  stroke?: null | string;
  train_id: string;
  type?: null | TmotCode;
}
export default FullTrajectoryProperties;
