/// <reference no-default-lib="true"/>
/// <reference lib="ES2015" />
/// <reference lib="webworker" />
/// <reference lib="dom" />

import GeoJSON from 'ol/format/GeoJSON';
import type { FrameState } from 'ol/PluggableMap';
import type { RealtimeStyleOptions, RealtimeTrajectories } from '../types';
import { realtimeSimpleStyle, realtimeDefaultStyle } from './styles';
import { renderTrajectories, realtimeConfig } from './utils';

const debug = false;
const trajectories: RealtimeTrajectories = {};

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
declare let self: DedicatedWorkerGlobalScope;

export type RealtimeWorkerRenderEvent = {
  data: {
    viewState: ViewState;
    options: RealtimeStyleOptions;
  };
};

let renderTimeout: number | null;
let count = 0;
const format = new GeoJSON();
const canvas = new OffscreenCanvas(1, 1);

const render = (evt: RealtimeWorkerRenderEvent) => {
  // eslint-disable-next-line no-console
  if (debug) console.time('render');
  // eslint-disable-next-line no-console
  if (debug) console.log('render', evt.data.viewState);
  count = 0;
  const { viewState, options } = evt.data;

  const { renderedTrajectories } = renderTrajectories(
    canvas,
    Object.values(trajectories),
    realtimeDefaultStyle,
    viewState,
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

  // eslint-disable-next-line no-restricted-globals
  self.postMessage(
    {
      action: 'rendered',
      imageData,
      viewState,
      nbRenderedTRajectories: renderedTrajectories?.length || 0,
    },
    [imageData],
  );
  renderTimeout = null;
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = (evt) => {
  // debugger;
  if (evt.data.action === 'addTrajectory') {
    const { trajectory } = evt.data;
    const id = trajectory.properties.train_id;
    trajectories[id] = trajectory;
    trajectories[id].properties.olGeometry = format.readGeometry(
      trajectory.geometry,
    );
    return;
  }

  if (evt.data.action === 'removeTrajectory') {
    delete trajectories[evt.data.trajectoryId];
    return;
  }

  // if (evt.data.action === 'sendData') {
  //   // eslint-disable-next-line no-console
  //   if (debug) console.log('sendData', evt.data);
  //   if (debug) console.time('sendData');
  //   trajectories = evt.data.trajectories;
  //   if (debug) console.timeEnd('sendData');
  //   return;
  // }

  if (evt.data.action !== 'render') {
    return;
  }

  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }

  // eslint-disable-next-line no-restricted-globals
  renderTimeout = self.setTimeout(() => {
    render(evt);
  }, 0);
};

// We need an export to force this file to act like a module, so TS will let us re-type `self`
// export default null;
