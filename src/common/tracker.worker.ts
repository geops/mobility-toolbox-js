/// <reference no-default-lib="true"/>
/// <reference lib="ES2015" />
/// <reference lib="webworker" />
/// <reference lib="dom" />

import GeoJSON from 'ol/format/GeoJSON';
import { intersects } from 'ol/extent';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import type { RealtimeTrajectory } from '../api/typedefs';
import { RealtimeAPI, RealtimeModes } from '../mapbox';
import type {
  RealtimeMot,
  RealtimeStyleOptions,
  RealtimeTrainId,
  RealtimeTrajectories,
} from '../types';
import type { WebSocketAPIMessageEventData } from './api/WebSocketAPI';
import { realtimeDefaultStyle } from './styles';
import { renderTrajectories, realtimeConfig } from './utils';

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
declare let self: DedicatedWorkerGlobalScope;
const debug = false;
const trajectories: RealtimeTrajectories = {};
let renderTimeout: number | null;
let count = 0;
const format = new GeoJSON();
const canvas = new OffscreenCanvas(1, 1);
let mots: RealtimeMot[] = [];
let extent: [number, number, number, number] = [0, 0, 0, 0];
let nextThrottleTick = 0;
let size: number = 100;
let viewState: ViewState | null = null;
let options: RealtimeStyleOptions = {};

const postMessage = (
  imageData: any,
  renderedViewState: any,
  renderedTrajectories: any,
) => {
  if (viewState?.zoom !== renderedViewState.zoom) {
    console.log('la');
    return;
  }
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(
    {
      action: 'rendered',
      imageData,
      viewState: renderedViewState,
      nbRenderedTrajectories: renderedTrajectories?.length || 0,
    },
    [imageData],
  );
};

const debouncePostMessage = debounce(postMessage, 150);
let throttlePostMessage = throttle(postMessage, 300);

const render = () => {
  // eslint-disable-next-line no-console
  if (debug) console.time('render');
  // eslint-disable-next-line no-console
  if (debug) console.log('render', viewState);
  count = 0;
  if (!viewState) {
    return;
  }
  const renderedViewState = { ...viewState };

  const { renderedTrajectories } = renderTrajectories(
    canvas,
    Object.values(trajectories),
    realtimeDefaultStyle,
    renderedViewState,
    {
      ...options,
      getRadius: realtimeConfig.getRadius,
      getTextColor: realtimeConfig.getTextColor,
      getBgColor: realtimeConfig.getBgColor,
      getDelayColor: realtimeConfig.getDelayColor,
      getTextSize: realtimeConfig.getTextSize,
    },
  );

  if (debug) console.timeEnd('render');
  if (debug) console.log('NUMBER OF STYLES CREATED', count);

  const imageData = canvas.transferToImageBitmap();

  if (viewState.zoom !== renderedViewState.zoom) {
    console.log('ici');
    return;
  }

  postMessage(imageData, renderedViewState, renderedTrajectories);
};

let debounceRender = debounce(render, 50, {
  leading: true,
  trailing: true,
  maxWait: 5000,
});

const addTrajectory = (trajectory: RealtimeTrajectory) => {
  const id = trajectory.properties.train_id;
  trajectories[id] = trajectory;
  trajectories[id].properties.olGeometry = format.readGeometry(
    trajectory.geometry,
  );
};

const removeTrajectory = (trajectoryId: RealtimeTrainId) => {
  delete trajectories[trajectoryId];
};

const purgeTrajectory = (
  trajectory: RealtimeTrajectory,
  extentt: [number, number, number, number],
) => {
  const { type, bounds } = trajectory.properties;

  if (!intersects(extentt, bounds) || (mots && !mots.includes(type))) {
    removeTrajectory(trajectory);
    return true;
  }
  return false;
};

const onTrajectoryMessage = (
  data: WebSocketAPIMessageEventData<RealtimeTrajectory>,
) => {
  if (!data.content) {
    return;
  }
  const trajectory = data.content;

  const {
    properties: { time_since_update: timeSinceUpdate },
  } = trajectory;

  // ignore old events [SBAHNM-97]
  if (timeSinceUpdate < 0) {
    return;
  }

  // console.time(`onTrajectoryMessage${data.content.properties.train_id}`);
  // @ts-ignore   default value for extent and zoom are provided by subclasses
  if (purgeTrajectory(trajectory, extent)) {
    return;
  }
  addTrajectory(trajectory);
  debounceRender();
};

const onDeleteTrajectoryMessage = (
  data: WebSocketAPIMessageEventData<RealtimeTrainId>,
) => {
  if (!data.content) {
    return;
  }
  removeTrajectory(data.content);
  debounceRender();
};

const api = new RealtimeAPI({
  apiKey: '5cc87b12d7c5370001c1d6554840ecb89d2743d2b0aad0588b8ba7eb',
});
api.open();
api.subscribeTrajectory(
  RealtimeModes.TOPOGRAPHIC,
  onTrajectoryMessage,
  undefined,
  true,
);
api.subscribeDeletedVehicles(
  RealtimeModes.TOPOGRAPHIC,
  onDeleteTrajectoryMessage,
  undefined,
  true,
);

export type RealtimeWorkerRenderEvent = {
  data: {
    viewState: ViewState;
    options: RealtimeStyleOptions;
  };
};
// eslint-disable-next-line no-restricted-globals
self.onmessage = (evt) => {
  const {
    data: { action, message, trajectory, trajectoryId },
  } = evt;

  // if (evt.data.action === 'sendData') {
  //   // eslint-disable-next-line no-console
  //   if (debug) console.log('sendData', evt.data);
  //   if (debug) console.time('sendData');
  //   trajectories = evt.data.trajectories;
  //   if (debug) console.timeEnd('sendData');
  //   return;
  // }
  if (action === 'renderTrajectories') {
    // trajectories = {};

    const {
      viewState: newViewState,
      noInterpolate,
      minZoomInterpolation,
    } = evt.data;
    viewState = newViewState;
    options.noInterpolate =
      (viewState?.zoom || 0) < (minZoomInterpolation || 8)
        ? true
        : noInterpolate;
    // console.log('renderTrajectories', options.noInterpolate);
    debounceRender();
    return;
  }

  if (action === 'buffer') {
    [nextThrottleTick, size] = message;
    debounceRender = debounce(render, nextThrottleTick, {
      leading: true,
      trailing: true,
      maxWait: 5000,
    });

    throttlePostMessage = throttle(postMessage, nextThrottleTick);

    api.buffer = message;
  }

  if (action === 'bbox') {
    extent = [message[0], message[1], message[2], message[3]];
    mots = message
      ?.find((value: string) => /^mots=/.test(value))
      ?.split('=')[1]
      ?.split(',');
    // Clean trajectories before sending the new bbox
    // Purge trajectories:
    // - which are outside the extent
    // - when it's bus and zoom level is too low for them
    if (trajectories && extent) {
      const keys = Object.keys(trajectories);
      for (let i = keys.length - 1; i >= 0; i -= 1) {
        purgeTrajectory(trajectories[keys[i]], extent);
      }
    }
    // trajectories = {};

    if (!extent) {
      return;
    }
    api.bbox = message;
    return;
  }

  if (action === 'addTrajectory') {
    addTrajectory(trajectory);
    return;
  }

  if (action === 'removeTrajectory') {
    removeTrajectory(trajectoryId);
    return;
  }

  if (action === 'render') {
    viewState = evt.data.viewState;
    options = evt.data.options;
    render();
    // debounceRender();
  }
};

// We need an export to force this file to act like a module, so TS will let us re-type `self`
// export default null;
