import stringify from 'json-stringify-safe';
// import GeoJSON from 'ol/format/GeoJSON';
import type { FrameState } from 'ol/PluggableMap';
import type { RealtimeStyleOptions, RealtimeTrajectories } from '../types';
import { realtimeSimpleStyle } from './styles';
import { renderTrajectories } from './utils';

const debug = false;

export type RealtimeWorkerRenderEvent = {
  data: {
    trajectories: RealtimeTrajectories;
    frameState: FrameState;
    viewState: ViewState;
    options: RealtimeStyleOptions;
  };
};

let renderTimeout: number | null;
let count = 0;
// const format = new GeoJSON();
const canvas = new OffscreenCanvas(1, 1);

const render = (evt: RealtimeWorkerRenderEvent) => {
  // eslint-disable-next-line no-console
  if (debug) console.time('render');
  // eslint-disable-next-line no-console
  if (debug) console.log('render', evt.data.frameState);
  count = 0;
  const { trajectories, frameState, viewState, options } = evt.data;

  const { renderedTrajectories } = renderTrajectories(
    canvas,
    Object.values(trajectories),
    realtimeSimpleStyle,
    viewState,
    options,
  );

  if (debug) console.timeEnd('render');
  if (debug) console.log('NUMBER OF STYLES CREATED', count);

  const imageData = canvas.transferToImageBitmap();
  const state = { ...frameState };
  // @ts-ignore
  delete state.layerStatesArray;
  // @ts-ignore
  delete state.viewState.projection;

  // eslint-disable-next-line no-restricted-globals
  self.postMessage(
    {
      action: 'rendered',
      imageData,
      // transform: rendererTransform,
      renderedTrajectories,
      frameState: JSON.parse(stringify(state)),
    },
    [imageData],
  );
  renderTimeout = null;
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = (evt) => {
  // debugger;
  // if (evt.data.action === 'addTrajectory') {
  //   const { trajectory } = evt.data;
  //   const id = trajectory.properties.train_id;
  //   trajectories[id] = trajectory;
  //   trajectories[id].properties.olGeometry = format.readGeometry(
  //     trajectory.geometry,
  //   );
  //   return;
  // }

  // if (evt.data.action === 'removeTrajectory') {
  //   delete trajectories[evt.data.trajectoryId];
  //   return;
  // }

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

// eslint-disable-next-line no-restricted-globals
export default self;
