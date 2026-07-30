import type { paths as RoutingPaths } from "./routing";
import type { paths as StopsPaths } from "./stops";

export type * from "../ol";
export type * from "./common";
export type * from "./maps";
export * as Moco from "./moco";
export * as Realtime from "./realtime";

export type RoutingParameters = RoutingPaths["/"]["get"]["parameters"]["query"];
export type RoutingResponse =
  RoutingPaths["/"]["get"]["responses"]["200"]["schema"];

/** Stops definitions */
export type StopsParameters = StopsPaths["/"]["get"]["parameters"]["query"];
export type StopsResponse =
  StopsPaths["/"]["get"]["responses"]["200"]["schema"];
