import type GeometryType from './GeometryType';
interface MultiPointGeometry {
  additionalProperties?: Map<string, any>;
  coordinates: number[][];
  type: GeometryType.MULTI_POINT;
}
export default MultiPointGeometry;
