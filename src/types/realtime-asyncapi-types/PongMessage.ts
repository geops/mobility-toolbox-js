import type ClientReference from './ClientReference';
import type Content from './Content';
import type Source from './Source';
interface PongMessage {
  additionalProperties?: Map<string, any>;
  client_reference: ClientReference;
  content: Content.PONG;
  source: Source.WEBSOCKET;
  timestamp: number;
}
export default PongMessage;
