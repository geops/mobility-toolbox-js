import type FullTrajectoryProperties from './FullTrajectoryProperties';
import type GeometryCollectionGeometry from './GeometryCollectionGeometry';
import type GeometryType from './GeometryType';
import type LineStringGeometry from './LineStringGeometry';
import type MultiLineStringGeometry from './MultiLineStringGeometry';
interface FullTrajectory {
  additionalProperties?: Map<string, any>;
  geometry:
    | GeometryCollectionGeometry
    | LineStringGeometry
    | MultiLineStringGeometry;
  properties: FullTrajectoryProperties;
  type: GeometryType.FEATURE;
}
export default FullTrajectory;
