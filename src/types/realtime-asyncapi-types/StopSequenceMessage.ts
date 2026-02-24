import type StopSequence from './StopSequence';
interface StopSequenceMessage {
  additionalProperties?: Map<string, unknown>;
  client_reference: string;
  content: null | StopSequence[];
  source: string;
  timestamp: number;
}
export default StopSequenceMessage;
