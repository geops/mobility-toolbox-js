import type ReservedType from './ReservedType';
interface MultiPointGeometry {
  additionalProperties?: Map<string, any>;
  coordinates: number[][];
  type: ReservedType.MULTI_POINT;
}
export default MultiPointGeometry;
