import type LineStringGeometry from './LineStringGeometry';
import type MultiLineStringGeometry from './MultiLineStringGeometry';
import type MultiPointGeometry from './MultiPointGeometry';
import type ReservedType from './ReservedType';
interface GeometryCollectionGeometry {
  additionalProperties?: Map<string, any>;
  geometries: (
    | LineStringGeometry
    | MultiLineStringGeometry
    | MultiPointGeometry
  )[];
  type: ReservedType.GEOMETRY_COLLECTION;
}
export default GeometryCollectionGeometry;
