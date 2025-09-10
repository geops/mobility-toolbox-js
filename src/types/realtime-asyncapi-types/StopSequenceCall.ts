import type AnonymousSchema_236 from './AnonymousSchema_236';
import type SerializedCancellationChange from './SerializedCancellationChange';
interface StopSequenceCall {
  additionalProperties?: Map<string, any>;
  aimedArrivalTime: null | number;
  aimedDepartureTime: null | number;
  arrivalDelay: null | number;
  arrivalTime: null | number;
  cancelled: boolean;
  changes?: SerializedCancellationChange[];
  coordinate: number[];
  departureDelay: null | number;
  departureTime: null | number;
  formation_id: null | number;
  noDropOff: boolean | null;
  noPickUp: boolean | null;
  platform: null | string;
  state?: AnonymousSchema_236 | null;
  stationId: null | number;
  stationName: null | string;
  stopUID: null | string;
}
export default StopSequenceCall;
