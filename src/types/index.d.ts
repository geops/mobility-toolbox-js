import type { operations as MocoOperations } from './moco';
import type { paths as RoutingPaths } from './routing';
import type { paths as StopsPaths } from './stops';
export type * from '../ol';

export type * from './common';
export type * from './maps';
export * from './moco/gql/graphql';
export type * from './realtime';

export type RealtimeVersion = '1' | '2';

export type RoutingParameters = RoutingPaths['/']['get']['parameters']['query'];
export type RoutingResponse =
  RoutingPaths['/']['get']['responses']['200']['schema'];

/** Stops definitions */
export type StopsParameters = StopsPaths['/']['get']['parameters']['query'];
export type StopsResponse =
  StopsPaths['/']['get']['responses']['200']['schema'];

export type MocoExportParameters = {
  apiKey?: string;
} & MocoOperations['v2_export_retrieve']['parameters']['query'];

export type MocoExportByIdParameters = {
  apiKey?: string;
} & MocoOperations['v2_export_retrieve_2']['parameters']['query'];
