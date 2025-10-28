import { paths as RoutingPaths } from './routing';
import { paths as StopsPaths } from './stops';
import {
  paths as MocoPaths,
  definitions as MocoDefinitions,
  operations as MocoOperations,
} from './moco';
import { SituationTypeExtendedOffsetPaginated } from './moco/gql/graphql';
export * from './moco/gql/graphql';

export * from './common';
export * from './ol';
export * from './realtime';
export * from './maps';

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
