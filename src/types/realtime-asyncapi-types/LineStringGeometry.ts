import type GeometryType from './GeometryType';
interface LineStringGeometry {
  additionalProperties?: Map<string, unknown>;
  coordinates: number[][];
  type: GeometryType.LINE_STRING;
}
export default LineStringGeometry;
