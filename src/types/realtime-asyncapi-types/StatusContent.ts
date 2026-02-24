import type ReservedStatus from './ReservedStatus';
interface StatusContent {
  additionalProperties?: Map<string, unknown>;
  status: ReservedStatus.RESERVED_OPEN;
}
export default StatusContent;
