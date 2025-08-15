import type StopSequence from './StopSequence';
interface StopSequenceMessage {
  additionalProperties?: Map<string, any>;
  client_reference: string;
  content: null | StopSequence[];
  source: string;
  timestamp: number;
}
export default StopSequenceMessage;
