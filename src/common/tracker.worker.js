import stringify from 'json-stringify-safe';
import { compose, apply, create } from 'ol/transform';
import GeoJSON from 'ol/format/GeoJSON';
import { delayTrackerStyle } from './utils';
import interpolatePosition from './interpolate';

const debug = false;

const trajectories = {};
let renderTimeout;
let count = 0;
const format = new GeoJSON();

const render = (evt) => {
  // eslint-disable-next-line no-console
  if (debug) console.time('render');
  // eslint-disable-next-line no-console
  if (debug) console.log('render', evt.data.frameState);
  count = 0;
  let nbRenderedTrajectories = 0;
  const { frameState } = evt.data;
  const {
    time = Date.now(),
    size = [],
    center,
    resolution,
    zoom,
    rotation = 0,
    pixelRatio,
    interpolate = true,
    iconScale,
    hoverVehicleId,
    selectedVehicleId,
    delayDisplay,
    delayOutlineColor,
    useDelayStyle,
  } = evt.data;

  const canvas = new OffscreenCanvas(
    size[0] * pixelRatio,
    size[1] * pixelRatio,
  );

  const canvasContext = canvas.getContext('2d');

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

  let hoverVehicleImg;
  let hoverVehiclePx;
  let hoverVehicleWidth;
  let hoverVehicleHeight;
  let selectedVehicleImg;
  let selectedVehiclePx;
  let selectedVehicleWidth;
  let selectedVehicleHeight;

  const keys = Object.keys(trajectories);
  for (let i = (keys || []).length - 1; i >= 0; i -= 1) {
    const trajectory = trajectories[keys[i]];
    const {
      geometry,
      properties: {
        coordinate,
        time_intervals: timeIntervals,
        time_offset: timeOffset,
        train_id: trainId,
      },
    } = trajectory;

    let coord = null;
    let rotationIcon = null;
    let endFraction = 0;

    if (coordinate && !interpolate) {
      coord = coordinate;
    } else if (timeIntervals && timeIntervals.length > 1) {
      const interpolated = interpolatePosition(
        time - (timeOffset || 0),
        geometry,
        timeIntervals,
      );

      // We set the rotation and the timeFraction of the trajectory (used by tralis).
      // if rotation === null that seems there is no rotation available.
      coord = interpolated.coord;
      rotationIcon = interpolated.rotation;
      endFraction = interpolated.timeFrac;
    }

    if (!coord) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // We apply the result of interpolation (or not) to the trajectory.
    trajectories[keys[i]].coordinate = coord;
    trajectories[keys[i]].rotation = rotationIcon;
    trajectories[keys[i]].endFraction = endFraction;

    let px = apply(coordinateToPixelTransform, [...coord]); // [...toLonLat(coord)]);

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

    px = px.map((p) => {
      return p * pixelRatio;
    });

    const vehicleImg = delayTrackerStyle(
      trajectory,
      {
        zoom,
        pixelRatio,
      },
      {
        hoverVehicleId,
        selectedVehicleId,
        delayDisplay,
        delayOutlineColor,
        useDelayStyle,
      },
    );

    if (!vehicleImg) {
      // eslint-disable-next-line no-continue
      continue;
    }

    nbRenderedTrajectories += 1;

    let imgWidth = vehicleImg.width;
    let imgHeight = vehicleImg.height;

    if (iconScale) {
      imgHeight = Math.floor(imgHeight * iconScale);
      imgWidth = Math.floor(imgWidth * iconScale);
    }

    if (hoverVehicleId !== trainId && selectedVehicleId !== trainId) {
      canvasContext.drawImage(
        vehicleImg,
        px[0] - imgWidth / 2,
        px[1] - imgHeight / 2,
        imgWidth,
        imgHeight,
      );
    }
    if (hoverVehicleId === trainId) {
      // Store the canvas to draw it at the end
      hoverVehicleImg = vehicleImg;
      hoverVehiclePx = px;
      hoverVehicleWidth = imgWidth;
      hoverVehicleHeight = imgHeight;
    }

    if (selectedVehicleId === trainId) {
      // Store the canvas to draw it at the end
      selectedVehicleImg = vehicleImg;
      selectedVehiclePx = px;
      selectedVehicleWidth = imgWidth;
      selectedVehicleHeight = imgHeight;
    }
  }

  if (selectedVehicleImg) {
    canvasContext.drawImage(
      selectedVehicleImg,
      selectedVehiclePx[0] - selectedVehicleWidth / 2,
      selectedVehiclePx[1] - selectedVehicleHeight / 2,
      selectedVehicleWidth,
      selectedVehicleHeight,
    );
  }

  if (hoverVehicleImg) {
    canvasContext.drawImage(
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
      nbRenderedTrajectories,
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
    const geometry = format.readGeometry(trajectory.geometry);
    trajectories[id] = { ...evt.data.trajectory, geometry };
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
