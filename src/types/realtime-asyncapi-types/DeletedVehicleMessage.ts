import type ClientReference from './ClientReference';
import type Source from './Source';
interface DeletedVehicleMessage {
  additionalProperties?: Map<string, unknown>;
  client_reference: ClientReference;
  content: string;
  source: Source.DELETED_VEHICLES;
  timestamp: number;
}
export default DeletedVehicleMessage;
