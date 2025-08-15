import type ClientReference from './ClientReference';
import type DeletedVehicleMessage from './DeletedVehicleMessage';
import type PartialTrajectoryMessage from './PartialTrajectoryMessage';
import type Source from './Source';
interface BufferMessage {
  additionalProperties?: Map<string, any>;
  client_reference: ClientReference;
  content: (DeletedVehicleMessage | null | PartialTrajectoryMessage)[];
  source: Source.BUFFER;
  timestamp: number;
}
export default BufferMessage;
