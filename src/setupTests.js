/* eslint-disable import/no-extraneous-dependencies */
import 'jest-canvas-mock';
import fetchTrajectoryByIdResponse from '../data/fetchTrajectoryById.json';
import fetchTrajectoriesResponse from '../data/fetchTrajectories.json';
import fetchTrajectoryStationsResponse from '../data/fetchTrajectoryStations.json';
import stopsSearchResponse from '../data/stopsSearch.json';
import fetchRouteResponse from '../data/fetchRoute.json';

global.fetchTrajectoryByIdResponse = fetchTrajectoryByIdResponse;
global.fetchTrajectoriesResponse = fetchTrajectoriesResponse;
global.fetchTrajectoryStationsResponse = fetchTrajectoryStationsResponse;
global.stopsSearchResponse = stopsSearchResponse;
global.fetchRouteResponse = fetchRouteResponse;

global.URL.createObjectURL = jest.fn(() => 'fooblob');

window.OffscreenCanvas = () => {
  return document.createElement('canvas');
};
