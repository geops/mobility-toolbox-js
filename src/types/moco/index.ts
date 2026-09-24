export * from "./graphql";
export * from "./rest";

import type * as Rest from "./rest";

export type ExportParameters = {
  apiKey?: string;
} & Rest.operations["v2_export_retrieve"]["parameters"]["query"];

export type ExportByIdParameters = {
  apiKey?: string;
} & Rest.operations["v2_export_retrieve_2"]["parameters"]["query"];
