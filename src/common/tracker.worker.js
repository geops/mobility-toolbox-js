import stringify from 'json-stringify-safe';
import { compose, apply, create } from 'ol/transform';
import GeoJSON from 'ol/format/GeoJSON';
import { delayTrackerStyle, getVehiclePosition } from './utils';

const debug = false;

const trajectories = {};
let renderTimeout;
let count = 0;
const format = new GeoJSON();
let canvas;

const render = (evt) => {
  // eslint-disable-next-line no-console
  if (debug) console.time('render');
  // eslint-disable-next-line no-console
  if (debug) console.log('render', evt.data.frameState);
  count = 0;
  const { frameState, viewState, options } = evt.data;

  const {
    time = Date.now(),
    size = [],
    center,
    resolution,
    rotation = 0,
    pixelRatio,
  } = viewState;
  const {
    iconScale,
    noInterpolate = false,
    hoverVehicleId,
    selectedVehicleId,
  } = options;

  if (!canvas) {
    canvas = new OffscreenCanvas(size[0] * pixelRatio, size[1] * pixelRatio);
  }

  const context = canvas.getContext('2d');
  const [width, height] = size;
  if (width && height && (canvas.width !== width || canvas.height !== height)) {
    [canvas.width, canvas.height] = [width * pixelRatio, height * pixelRatio];
  }

  const coordinateToPixelTransform = compose(
    create(),
    size[0] / 2,
    size[1] / 2,
    1 / resolution,
    -1 / resolution,
    -rotation,
    -center[0],
    -center[1],
  );

  // canvas.style.width = `${canvas.width / pixelRatio}px`;
  // canvas.style.height = `${canvas.height / pixelRatio}px`;

  let hoverVehicleImg;
  let hoverVehiclePx;
  let hoverVehicleWidth;
  let hoverVehicleHeight;
  let selectedVehicleImg;
  let selectedVehiclePx;
  let selectedVehicleWidth;
  let selectedVehicleHeight;
  let nbRendered = 0;

  const keys = Object.keys(trajectories);
  for (let i = (keys || []).length - 1; i >= 0; i -= 1) {
    const trajectory = trajectories[keys[i]];

    // We simplify the trajectory object
    const { train_id: id, timeOffset } = trajectory.properties;

    // We set the rotation and the timeFraction of the trajectory (used by tralis).
    // if rotation === null that seems there is no rotation available.
    const { coord, rotation: rotationIcon } = getVehiclePosition(
      time - (timeOffset || 0),
      trajectory,
      noInterpolate,
    );

    // We store  the current vehicle position to the trajectory.
    trajectories[keys[i]].properties.coordinate = coord;
    trajectories[keys[i]].properties.rotation = rotationIcon;

    if (!coord) {
      // eslint-disable-next-line no-continue
      continue;
    }

    let px = apply(coordinateToPixelTransform, [...coord]);
    if (!px) {
      // eslint-disable-next-line no-continue
      continue;
    }

    px = px.map((p) => p * pixelRatio);

    if (
      px[0] < 0 ||
      px[0] > canvas.width ||
      px[1] < 0 ||
      px[1] > canvas.height
    ) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const vehicleImg = delayTrackerStyle(trajectory, viewState, options);

    if (!vehicleImg) {
      // eslint-disable-next-line no-continue
      continue;
    }

    nbRendered += 1;

    let imgWidth = vehicleImg.width;
    let imgHeight = vehicleImg.height;

    if (iconScale) {
      imgHeight = Math.floor(imgHeight * iconScale);
      imgWidth = Math.floor(imgWidth * iconScale);
    }

    if (hoverVehicleId !== id && selectedVehicleId !== id) {
      context.drawImage(
        vehicleImg,
        px[0] - imgWidth / 2,
        px[1] - imgHeight / 2,
        imgWidth,
        imgHeight,
      );
    }
    if (hoverVehicleId === id) {
      // Store the canvas to draw it at the end
      hoverVehicleImg = vehicleImg;
      hoverVehiclePx = px;
      hoverVehicleWidth = imgWidth;
      hoverVehicleHeight = imgHeight;
    }

    if (selectedVehicleId === id) {
      // Store the canvas to draw it at the end
      selectedVehicleImg = vehicleImg;
      selectedVehiclePx = px;
      selectedVehicleWidth = imgWidth;
      selectedVehicleHeight = imgHeight;
    }
  }

  if (selectedVehicleImg) {
    context.drawImage(
      selectedVehicleImg,
      selectedVehiclePx[0] - selectedVehicleWidth / 2,
      selectedVehiclePx[1] - selectedVehicleHeight / 2,
      selectedVehicleWidth,
      selectedVehicleHeight,
    );
  }

  if (hoverVehicleImg) {
    context.drawImage(
      hoverVehicleImg,
      hoverVehiclePx[0] - hoverVehicleWidth / 2,
      hoverVehiclePx[1] - hoverVehicleHeight / 2,
      hoverVehicleWidth,
      hoverVehicleHeight,
    );
  }
  if (debug) console.timeEnd('render');
  if (debug) console.log('NUMBER OF STYLES CREATED', count);

  const imageData = canvas.transferToImageBitmap();
  const state = { ...frameState };
  delete state.layerStatesArray;
  delete state.viewState.projection;

  // eslint-disable-next-line no-restricted-globals
  self.postMessage(
    {
      action: 'rendered',
      imageData,
      // transform: rendererTransform,
      nbRenderedTrajectories: nbRendered,
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
