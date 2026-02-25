import type GeometryType from './GeometryType';
interface MultiPointGeometry {
  additionalProperties?: Map<string, unknown>;
  coordinates: number[][];
  type: GeometryType.MULTI_POINT;
}
export default MultiPointGeometry;
