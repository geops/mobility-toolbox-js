import type BufferMessage from './BufferMessage';
import type DeletedVehicleMessage from './DeletedVehicleMessage';
import type FullTrajectoryMessage from './FullTrajectoryMessage';
import type LogMessage from './LogMessage';
import type PartialTrajectoryMessage from './PartialTrajectoryMessage';
import type PongMessage from './PongMessage';
import type StatusMessage from './StatusMessage';
import type StopSequenceMessage from './StopSequenceMessage';
type Slash =
  | BufferMessage
  | DeletedVehicleMessage
  | FullTrajectoryMessage
  | LogMessage
  | PartialTrajectoryMessage
  | PongMessage
  | StatusMessage
  | StopSequenceMessage;
export default Slash;
