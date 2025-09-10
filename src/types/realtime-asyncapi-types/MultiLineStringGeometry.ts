import type ReservedType from './ReservedType';
interface MultiLineStringGeometry {
  additionalProperties?: Map<string, any>;
  coordinates: number[][][];
  type: ReservedType.MULTI_LINE_STRING;
}
export default MultiLineStringGeometry;
