import type GeometryType from './GeometryType';
interface MultiLineStringGeometry {
  additionalProperties?: Map<string, unknown>;
  coordinates: number[][][];
  type: GeometryType.MULTI_LINE_STRING;
}
export default MultiLineStringGeometry;
