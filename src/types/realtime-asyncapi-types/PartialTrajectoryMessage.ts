import type TrackerTrajectory from './TrackerTrajectory';
interface PartialTrajectoryMessage {
  additionalProperties?: Map<string, any>;
  client_reference: string;
  content: null | TrackerTrajectory;
  source: string;
  timestamp: number;
}
export default PartialTrajectoryMessage;
