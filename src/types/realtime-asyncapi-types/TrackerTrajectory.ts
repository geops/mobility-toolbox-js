import type GeometryType from './GeometryType';
import type LineStringGeometry from './LineStringGeometry';
import type TrackerTrajectoryProperties from './TrackerTrajectoryProperties';
interface TrackerTrajectory {
  additionalProperties?: Map<string, unknown>;
  geometry: LineStringGeometry;
  properties: TrackerTrajectoryProperties;
  type: GeometryType.FEATURE;
}
export default TrackerTrajectory;
