import { paths as routing } from './routing';
import { paths as stops } from './stops';
export * from './realtime';

export type RoutingParameters = routing['/']['get']['parameters']['query'];
export type RoutingResponse = routing['/']['get']['responses']['200']['schema'];

export type StopsParameters = stops['/']['get']['parameters']['query'];
export type StopsResponse = stops['/']['get']['responses']['200']['schema'];
