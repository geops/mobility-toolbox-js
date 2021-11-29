import { Point, LineString } from 'ol/geom';
import GeomType from 'ol/geom/GeometryType';
import stringify from 'json-stringify-safe';
import { compose, apply, create } from 'ol/transform';
import { delayTrackerStyle } from './utils';

const debug = false;

let trajectories = [];

let renderTimeout;
let count = 0;

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
    rotation,
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

  for (let i = (trajectories || []).length - 1; i >= 0; i -= 1) {
    const traj = trajectories[i];

    // We simplify the traj object
    let { geometry } = traj;
    const { coordinate } = traj;
    let { timeIntervals, timeOffset } = traj;

    // Tralis retuirn a feature in Geojson format
    if (traj.properties) {
      if (traj.properties.time_intervals) {
        timeIntervals = traj.properties.time_intervals;
      }
      if (traj.properties.time_offset) {
        timeOffset = traj.properties.time_offset;
      }
    }

    if (Array.isArray(geometry.coordinates)) {
      if (geometry.type === 'Point') {
        geometry = new Point(geometry.coordinates);
      } else if (geometry.type === 'LineString') {
        geometry = new LineString(geometry.coordinates);
      }
    }

    // Filter should apply when we request the data
    // if (filter && !filter(traj, i, trajectories)) {
    //   // eslint-disable-next-line no-continue
    //   continue;
    // }

    let coord = null;
    let rotationIcon;

    if (coordinate && !interpolate) {
      coord = coordinate;
    } else if (timeIntervals && timeIntervals.length > 1) {
      const now = time - (timeOffset || 0);
      let start;
      let end;
      let startFrac;
      let endFrac;
      let timeFrac;

      // Search th time interval.
      for (let j = 0; j < timeIntervals.length - 1; j += 1) {
        // Rotation only available in tralis layer.
        [start, startFrac, rotationIcon] = timeIntervals[j];
        [end, endFrac] = timeIntervals[j + 1];

        if (start <= now && now <= end) {
          break;
        } else {
          start = null;
          end = null;
        }
      }
      // The geometry can also be a Point
      if (geometry.getType() === GeomType.POINT) {
        coord = geometry.getCoordinates();
      } else if (geometry.getType() === GeomType.LINE_STRING) {
        if (start && end) {
          // interpolate position inside the time interval.
          timeFrac = interpolate
            ? Math.min((now - start) / (end - start), 1)
            : 0;

          const geomFrac = interpolate
            ? timeFrac * (endFrac - startFrac) + startFrac
            : 0;

          coord = geometry.getCoordinateAt(geomFrac);

          // We set the rotation and the timeFraction of the trajectory (used by tralis).
          trajectories[i].rotation = rotation;
          trajectories[i].endFraction = timeFrac;

          // It happens that the now date was some ms before the first timeIntervals we have.
        } else if (now < timeIntervals[0][0]) {
          [[, , rotationIcon]] = timeIntervals;
          timeFrac = 0;
          coord = geometry.getFirstCoordinate();
        } else if (now > timeIntervals[timeIntervals.length - 1][0]) {
          [, , rotationIcon] = timeIntervals[timeIntervals.length - 1];
          timeFrac = 1;
          coord = geometry.getLastCoordinate();
        }
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'This geometry type is not supported. Only Point or LineString are. Current geometry: ',
          geometry,
        );
      }
      // We set the rotation and the timeFraction of the trajectory (used by tralis).
      // if rotation === null that seems there is no rotation available.
      trajectories[i].rotation = rotationIcon;
      trajectories[i].endFraction = timeFrac || 0;
    }

    if (coord) {
      // We set the rotation of the trajectory (used by tralis).
      trajectories[i].coordinate = coord;

      let px = apply(coordinateToPixelTransform, [...coord]); // [...toLonLat(coord)]);

      if (!px) {
        // eslint-disable-next-line no-continue
        continue;
      }
      nbRenderedTrajectories += 1;

      px = px.map((p) => {
        return p * pixelRatio;
      });

      const vehicleImg = delayTrackerStyle(
        traj.properties || traj,
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

      let imgWidth = vehicleImg.width;
      let imgHeight = vehicleImg.height;

      if (iconScale) {
        imgHeight = Math.floor(imgHeight * iconScale);
        imgWidth = Math.floor(imgWidth * iconScale);
      }

      if (hoverVehicleId !== traj.id && selectedVehicleId !== traj.id) {
        canvasContext.drawImage(
          vehicleImg,
          px[0] - imgWidth / 2,
          px[1] - imgHeight / 2,
          imgWidth,
          imgHeight,
        );
      }
      if (hoverVehicleId === traj.id) {
        // Store the canvas to draw it at the end
        hoverVehicleImg = vehicleImg;
        hoverVehiclePx = px;
        hoverVehicleWidth = imgWidth;
        hoverVehicleHeight = imgHeight;
      }

      if (selectedVehicleId === traj.id) {
        // Store the canvas to draw it at the end
        selectedVehicleImg = vehicleImg;
        selectedVehiclePx = px;
        selectedVehicleWidth = imgWidth;
        selectedVehicleHeight = imgHeight;
      }
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
self.onmessage = function (evt) {
  // debugger;
  if (evt.data.action === 'sendData') {
    // eslint-disable-next-line no-console
    if (debug) console.log('sendData', evt.data);
    if (debug) console.time('sendData');
    trajectories = evt.data.trajectories;
    if (debug) console.timeEnd('sendData');
    return;
  }

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
