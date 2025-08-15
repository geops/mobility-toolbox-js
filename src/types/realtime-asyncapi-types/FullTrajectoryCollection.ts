import type FullTrajectory from './FullTrajectory';
import type FullTrajectoryCollectionProperties from './FullTrajectoryCollectionProperties';
import type ReservedType from './ReservedType';
interface FullTrajectoryCollection {
  additionalProperties?: Map<string, any>;
  features: FullTrajectory[];
  properties: FullTrajectoryCollectionProperties;
  type: ReservedType.FEATURE_COLLECTION;
}
export default FullTrajectoryCollection;
