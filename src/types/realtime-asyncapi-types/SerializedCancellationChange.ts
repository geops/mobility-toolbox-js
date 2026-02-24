import type TCallStateEnum from './TCallStateEnum';
interface SerializedCancellationChange {
  additionalProperties?: Map<string, unknown>;
  new_to?: null | string;
  no_stop_between?: (null | string)[];
  no_stop_till?: null | string;
  old_to?: null | string;
  state?: null | TCallStateEnum;
}
export default SerializedCancellationChange;
