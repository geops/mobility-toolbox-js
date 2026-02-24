import type SerializedCancellationChange from './SerializedCancellationChange';
import type TCallStateEnum from './TCallStateEnum';
interface StopSequenceCall {
  additionalProperties?: Map<string, unknown>;
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
  state?: null | TCallStateEnum;
  stationId: null | number;
  stationName: null | string;
  stopUID: null | string;
}
export default StopSequenceCall;
