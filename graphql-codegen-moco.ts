import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  generates: {
    "./src/types/moco/graphql/index.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        {
          add: {
            content: `export type JsonValue =
                          | string
                          | number
                          | boolean
                          | null
                          | JsonObject
                          | JsonArray;
                        export interface JsonArray extends Array<JsonValue> {}
                        export interface JsonObject {
                          [key: string]: JsonValue;
                        }`,
          },
        },
      ],
      config: {
        enumsAsConst: true,
        scalars: {
          GeoJSONDict: "GeoJSON.Geometry",
          DateTime: "string",
          Date: "string",
          JSON: "JsonObject",
          Time: "string",
          UUID: "string",
        },
      },
    },
  },
  schema: "./src/types/moco/schema.graphql",
};
export default config;
