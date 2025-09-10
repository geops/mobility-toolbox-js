import type ClientReference from './ClientReference';
import type Source from './Source';
import type StatusContent from './StatusContent';
interface StatusMessage {
  additionalProperties?: Map<string, any>;
  client_reference: ClientReference;
  content: StatusContent;
  source: Source.WEBSOCKET;
  timestamp: number;
}
export default StatusMessage;
