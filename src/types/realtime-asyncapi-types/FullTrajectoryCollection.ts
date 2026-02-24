import type FullTrajectory from './FullTrajectory';
import type FullTrajectoryCollectionProperties from './FullTrajectoryCollectionProperties';
import type GeometryType from './GeometryType';
interface FullTrajectoryCollection {
  additionalProperties?: Map<string, any>;
  features: FullTrajectory[];
  properties: FullTrajectoryCollectionProperties;
  type: GeometryType.FEATURE_COLLECTION;
}
export default FullTrajectoryCollection;
