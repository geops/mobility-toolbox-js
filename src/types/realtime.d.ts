import { Feature } from 'geojson';

export interface RealtimeTrajectory extends Feature {}

export interface RealtimeTrajectoryResponse {
  train_id: 'trajectory';
  timestamp: number;
  client_reference: '';
  content: [RealtimeTrajectory];
}

export interface RealtimeBufferResponse {
  source: 'buffer';
  timestamp: number;
  client_reference: '';
  content: [RealtimeTrajectoryResponse];
}

export interface RealtimeResponse {
  source: string;
  timestamp: number;
  client_reference: 'None';
  content: [RealtimeBufferResponse];
}
