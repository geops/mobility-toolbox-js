import type GeometryType from './GeometryType';
import type LineStringGeometry from './LineStringGeometry';
import type MultiLineStringGeometry from './MultiLineStringGeometry';
import type MultiPointGeometry from './MultiPointGeometry';
interface GeometryCollectionGeometry {
  additionalProperties?: Map<string, any>;
  geometries: (
    | LineStringGeometry
    | MultiLineStringGeometry
    | MultiPointGeometry
  )[];
  type: GeometryType.GEOMETRY_COLLECTION;
}
export default GeometryCollectionGeometry;
