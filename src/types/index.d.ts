import { Paths as Routing } from './routing';
import { Paths as Stops } from './stops';

export * from './common';
export * from './realtime';
export * from './ol';

export type RoutingParameters = Routing['/']['get']['parameters']['query'];
export type RoutingResponse = Routing['/']['get']['responses']['200']['schema'];

export type StopsParameters = Stops['/']['get']['parameters']['query'];
export type StopsResponse = Stops['/']['get']['responses']['200']['schema'];

export type RealtimeVersion = '1' | '2';
