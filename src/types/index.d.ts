import { Paths as Routing } from './routing';
import { Paths as Stops } from './stops';
import { Paths as Moco, definitions as MocoDefinitions } from './moco';

export * from './common';
export * from './ol';
export * from './realtime';
export * from './maps';

export type MocoDefinitions = MocoDefinitions;
export type MocoParameters =
  Moco['/export/publication/']['get']['parameters']['query'];

export type RealtimeVersion = '1' | '2';

export type RoutingParameters = Routing['/']['get']['parameters']['query'];
export type RoutingResponse = Routing['/']['get']['responses']['200']['schema'];

export type StopsParameters = Stops['/']['get']['parameters']['query'];
export type StopsResponse = Stops['/']['get']['responses']['200']['schema'];

/** Simplified MOCO definitions */
export type MocoNotification = MocoDefinitions['GeoJSON'];
export type MocoNotificationProperties =
  MocoDefinitions['FeatureCollectionProperties'];

export type MocoNotificationFeature = MocoDefinitions['AffectedLinesFeature'];

export type MocoNotificationFeatureProperties =
  MocoDefinitions['AffectedLineProperties'];
