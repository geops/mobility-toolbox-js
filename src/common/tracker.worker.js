import stringify from 'json-stringify-safe';
import GeoJSON from 'ol/format/GeoJSON';
import { delayTrackerStyle } from './utils';
import Tracker from './Tracker';

const debug = false;

const trajectories = {};
let renderTimeout;
let count = 0;
const format = new GeoJSON();
const tracker = new Tracker({
  canvas: new OffscreenCanvas(1, 1),
  width: 1,
  height: 1,
  style: delayTrackerStyle,
});

const render = (evt) => {
  // eslint-disable-next-line no-console
  if (debug) console.time('render');
  // eslint-disable-next-line no-console
  if (debug) console.log('render', evt.data.frameState);
  count = 0;
  const { frameState, viewState, options } = evt.data;

  const { nbTrajectoriesRendered } = tracker.renderTrajectories(
    Object.values(trajectories),
    viewState,
    options,
  );

  if (debug) console.timeEnd('render');
  if (debug) console.log('NUMBER OF STYLES CREATED', count);

  const imageData = tracker.canvas.transferToImageBitmap();
  const state = { ...frameState };
  delete state.layerStatesArray;
  delete state.viewState.projection;

  // eslint-disable-next-line no-restricted-globals
  self.postMessage(
    {
      action: 'rendered',
      imageData,
      // transform: rendererTransform,
      nbRenderedTrajectories: nbTrajectoriesRendered,
      frameState: JSON.parse(stringify(state)),
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

  renderTimeout = setTimeout(() => {
    render(evt);
  }, 0);
};
