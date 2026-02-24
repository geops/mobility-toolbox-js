interface Line {
  additionalProperties?: Map<string, unknown>;
  color: null | string;
  id: number;
  name: null | string;
  stroke: null | string;
  tags: string[];
  text_color: null | string;
}
export default Line;
