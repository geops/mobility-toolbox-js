import { Paths as Routing } from './routing';
import { Paths as Stops } from './stops';

export * from './realtime';
export * from './common';

export type RoutingParameters = Routing['/']['get']['parameters']['query'];
export type RoutingResponse = Routing['/']['get']['responses']['200']['schema'];

export type StopsParameters = Stops['/']['get']['parameters']['query'];
export type StopsResponse = Stops['/']['get']['responses']['200']['schema'];
