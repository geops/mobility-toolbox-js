import type FullTrajectoryCollection from './FullTrajectoryCollection';
interface FullTrajectoryMessage {
  additionalProperties?: Map<string, any>;
  client_reference: string;
  content: FullTrajectoryCollection | null;
  source: string;
  timestamp: number;
}
export default FullTrajectoryMessage;
