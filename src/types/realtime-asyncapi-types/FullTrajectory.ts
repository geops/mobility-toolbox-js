import type FullTrajectoryProperties from './FullTrajectoryProperties';
import type GeometryCollectionGeometry from './GeometryCollectionGeometry';
import type LineStringGeometry from './LineStringGeometry';
import type MultiLineStringGeometry from './MultiLineStringGeometry';
import type ReservedType from './ReservedType';
interface FullTrajectory {
  additionalProperties?: Map<string, any>;
  geometry:
    | GeometryCollectionGeometry
    | LineStringGeometry
    | MultiLineStringGeometry;
  properties: FullTrajectoryProperties;
  type: ReservedType.FEATURE;
}
export default FullTrajectory;
