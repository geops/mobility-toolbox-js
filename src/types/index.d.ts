import { paths as RoutingPaths } from './routing';
import { paths as StopsPaths } from './stops';
import { paths as MocoPaths, definitions as MocoDefinitions } from './moco';

export * from './common';
export * from './ol';
export * from './realtime';

export type RealtimeVersion = '1' | '2';

export type RoutingParameters = RoutingPaths['/']['get']['parameters']['query'];
export type RoutingResponse =
  RoutingPaths['/']['get']['responses']['200']['schema'];

/** Stops definitions */
export type StopsParameters = StopsPaths['/']['get']['parameters']['query'];
export type StopsResponse =
  StopsPaths['/']['get']['responses']['200']['schema'];

/** MOCO definitions */
export type MocoReasonCategory =
  | 'Allegemein'
  | 'Das Personal betreffend'
  | 'Sicherheitsrelevant'
  | 'Spezielle Anlässe'
  | 'Technische Probleme'
  | 'Umwelteinflüsse'
  | 'Undefiniert'
  | 'Unfall'
  | 'Verkehrliche Gründe'
  | 'Verschiedenes';
export type MocoDefinitions = MocoDefinitions;
export type MocoParameters =
  MocoPaths['/export/publication/']['get']['parameters']['query'];
export type MocoNotification = MocoDefinitions['GeoJSON'];
export type MocoNotificationProperties =
  MocoDefinitions['FeatureCollectionProperties'];

export type MocoNotificationFeature = MocoDefinitions['AffectedLinesFeature'];

export type MocoNotificationFeatureProperties =
  MocoDefinitions['AffectedLineProperties'];
