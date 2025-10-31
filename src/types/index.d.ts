import { paths as RoutingPaths } from './routing';
import { paths as StopsPaths } from './stops';
import { operations as MocoOperations } from './moco';
export * from './moco/gql/graphql';

export type * from './common';
export type * from '../ol';
export type * from './realtime';
export type * from './maps';

export type RealtimeVersion = '1' | '2';

export type RoutingParameters = RoutingPaths['/']['get']['parameters']['query'];
export type RoutingResponse =
  RoutingPaths['/']['get']['responses']['200']['schema'];

/** Stops definitions */
export type StopsParameters = StopsPaths['/']['get']['parameters']['query'];
export type StopsResponse =
  StopsPaths['/']['get']['responses']['200']['schema'];

export type MocoExportParameters =
  MocoOperations['v2_export_retrieve']['parameters']['query'] & {
    apiKey?: string;
  };

export type MocoExportByIdParameters =
  MocoOperations['v2_export_retrieve_2']['parameters']['query'] & {
    apiKey?: string;
  };
