import type LineStringGeometry from './LineStringGeometry';
import type ReservedType from './ReservedType';
import type TrackerTrajectoryProperties from './TrackerTrajectoryProperties';
interface TrackerTrajectory {
  additionalProperties?: Map<string, any>;
  geometry: LineStringGeometry;
  properties: TrackerTrajectoryProperties;
  type: ReservedType.FEATURE;
}
export default TrackerTrajectory;
