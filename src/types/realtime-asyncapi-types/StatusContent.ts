import type ReservedStatus from './ReservedStatus';
interface StatusContent {
  additionalProperties?: Map<string, any>;
  status: ReservedStatus.RESERVED_OPEN;
}
export default StatusContent;
