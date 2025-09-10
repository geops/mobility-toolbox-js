import type AnonymousSchema_243 from './AnonymousSchema_243';
interface SerializedCancellationChange {
  additionalProperties?: Map<string, any>;
  new_to?: null | string;
  no_stop_between?: (null | string)[];
  no_stop_till?: null | string;
  old_to?: null | string;
  state?: AnonymousSchema_243 | null;
}
export default SerializedCancellationChange;
