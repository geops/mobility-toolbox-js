import type ClientReference from './ClientReference';
import type LogContent from './LogContent';
import type Source from './Source';
interface LogMessage {
  additionalProperties?: Map<string, any>;
  client_reference: ClientReference;
  content: LogContent;
  source: Source.WEBSOCKET;
  timestamp: number;
}
export default LogMessage;
