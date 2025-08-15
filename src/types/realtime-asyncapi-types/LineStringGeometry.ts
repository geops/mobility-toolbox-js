import type ReservedType from './ReservedType';
interface LineStringGeometry {
  additionalProperties?: Map<string, any>;
  coordinates: number[][];
  type: ReservedType.LINE_STRING;
}
export default LineStringGeometry;
