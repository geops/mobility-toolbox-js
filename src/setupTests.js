import fetchRouteResponse from "../data/fetchRoute.json";
import fetchTrajectoriesResponse from "../data/fetchTrajectories.json";
import fetchTrajectoryByIdResponse from "../data/fetchTrajectoryById.json";
import fetchTrajectoryStationsResponse from "../data/fetchTrajectoryStations.json";
import stopsSearchResponse from "../data/stopsSearch.json";

import "jest-canvas-mock";

global.fetchTrajectoryByIdResponse = fetchTrajectoryByIdResponse;
global.fetchTrajectoriesResponse = fetchTrajectoriesResponse;
global.fetchTrajectoryStationsResponse = fetchTrajectoryStationsResponse;
global.stopsSearchResponse = stopsSearchResponse;
global.fetchRouteResponse = fetchRouteResponse;

global.URL.createObjectURL = jest.fn(() => {
  return "fooblob";
});

// a proper class (not an arrow function) so `instanceof OffscreenCanvas` works
class OffscreenCanvas {
  constructor() {
    return document.createElement("canvas");
  }
}

window.OffscreenCanvas = OffscreenCanvas;

/* eslint-disable */
class ResizeObserver {
  constructor(onResize) {
    ResizeObserver.onResize = onResize;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

window.noop = () => {};
class Worker {
  url;
  onmessage;
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = noop;
  }
  postMessage(msg) {
    this.onmessage(msg);
  }
}

Object.defineProperty(window, "Worker", {
  writable: true,
  value: Worker,
});

class TextEncoder {
  constructor() {}
  encode() {}
  decode() {}
}

global.TextEncoder = TextEncoder;
global.TextDecoder = TextEncoder;
