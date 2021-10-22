import { Point, LineString } from 'ol/geom';
import GeomType from 'ol/geom/GeometryType';
import stringify from 'json-stringify-safe';
import { compose, apply, create } from 'ol/transform';
import {
  getDelayBgCanvas,
  getDelayTextCanvas,
  getCircleCanvas,
  getTextCanvas,
} from './trackerStyleConfig';
import {
  getRadius,
  getDelayColor,
  getDelayText,
  getBgColor,
  getTextColor,
  getTextSize,
} from './trackerConfig';

const debug = false;

let trajectories = [];
const styleCache = {};
// const defaultStyle = (traj) => {
//   // const { id: text } = traj;
//   const text = 'la';
//   if (styleCache[text]) {
//     return styleCache[text];
//   }
//   const canvas = new OffscreenCanvas(15, 15);
//   const ctx = canvas.getContext('2d');
//   ctx.arc(8, 8, 5, 0, 2 * Math.PI, false);
//   ctx.fillStyle = '#8ED6FF';
//   ctx.fill();
//   ctx.lineWidth = 3;
//   ctx.strokeStyle = 'black';
//   ctx.stroke();
//   // ctx.font = 'bold 12px arial';
//   // ctx.strokeStyle = 'white';
//   // ctx.lineWidth = 3;
//   // ctx.strokeText(text, 20, 10);
//   // ctx.fillStyle = 'black';
//   // ctx.fillText(text, 20, 10);
//   styleCache[text] = canvas;
//   return styleCache[text];
// };
let count = 0;
const style = (
  trajectory,
  zoom,
  pixelRatio,
  hoverVehicleId,
  selectedVehicleId,
  delayDisplay,
  delayOutlineColor,
  useDelayStyle,
  operatorProvidesRealtime,
) => {
  const { type, name, id, color, textColor, delay, cancelled } = trajectory;
  const z = Math.min(Math.floor(zoom || 1), 16);
  const hover = hoverVehicleId === id;
  const selected = selectedVehicleId === id;
  let key = `${z}${type}${name}${color}${operatorProvidesRealtime}${delay}${hover}${selected}${cancelled}`;

  let radius = getRadius(type, z) * pixelRatio;
  const mustDrawText = radius > 10 * pixelRatio;

  if (!mustDrawText) {
    key = `${z}${type}${color}${operatorProvidesRealtime}${delay}${hover}${selected}${cancelled}`;
  }

  if (!styleCache[key]) {
    count += 1;
    const isDisplayStrokeAndDelay = radius >= 7 * pixelRatio;

    if (radius === 0) {
      styleCache[key] = null;
      return null;
    }

    if (hover || selected) {
      radius = isDisplayStrokeAndDelay
        ? radius + 5 * pixelRatio
        : 14 * pixelRatio;
    }
    const margin = 1 * pixelRatio;
    const radiusDelay = radius + 2;
    const markerSize = radius * 2;
    const textWidth = 100;
    const size = (radiusDelay * 2 + margin * 2 + textWidth) * pixelRatio;
    const canvas = new OffscreenCanvas(size, size);
    // console.log('size: ', size);
    const ctx = canvas.getContext('2d');
    const origin = canvas.width / 2;

    if (isDisplayStrokeAndDelay && delay !== null) {
      // Draw circle delay background
      const delayBg = getDelayBgCanvas(
        origin,
        radiusDelay,
        getDelayColor(delay, cancelled),
      );
      ctx.drawImage(delayBg, 0, 0);
    }

    // Show delay if feature is hovered or if delay is above 5mins.
    if (
      isDisplayStrokeAndDelay &&
      (hover || delay >= delayDisplay || cancelled)
    ) {
      // Draw delay text
      const fontSize = Math.max(
        cancelled ? 19 : 14,
        Math.min(cancelled ? 19 : 17, radius * 1.2),
      );
      const delayText = getDelayTextCanvas(
        textWidth,
        getDelayText(delay, cancelled),
        fontSize,
        `bold ${fontSize}px arial, sans-serif`,
        getDelayColor(delay, cancelled, true),
        delayOutlineColor,
        pixelRatio,
      );
      ctx.drawImage(
        delayText,
        origin + radiusDelay + margin,
        origin - fontSize,
      );
    }

    // Draw colored circle with black border
    let circleFillColor;
    if (useDelayStyle) {
      circleFillColor = getDelayColor(delay, cancelled);
    } else {
      circleFillColor = color || getBgColor(type);
    }

    const hasStroke = isDisplayStrokeAndDelay || hover || selected;

    const hasDash =
      isDisplayStrokeAndDelay &&
      useDelayStyle &&
      delay === null &&
      operatorProvidesRealtime === 'yes';

    const circle = getCircleCanvas(
      origin,
      radius,
      circleFillColor,
      hasStroke,
      hasDash,
      pixelRatio,
    );

    ctx.drawImage(circle, 0, 0);

    // Draw text in the circle
    if (mustDrawText) {
      const fontSize = Math.max(radius, 10);
      const textSize = getTextSize(ctx, markerSize, name, fontSize);
      const textColor2 = !useDelayStyle
        ? textColor || getTextColor(type)
        : '#000000';
      const hasStroke2 =
        useDelayStyle && delay === null && operatorProvidesRealtime === 'yes';

      const text = getTextCanvas(
        name,
        origin,
        textSize,
        textColor2,
        circleFillColor,
        hasStroke2,
        pixelRatio,
      );

      ctx.drawImage(text, 0, 0);
      // Draw a stroke to the text only if a provider provides realtime but we don't use it.
      // if (
      //   useDelayStyle &&
      //   delay === null &&
      //   operatorProvidesRealtime === 'yes'
      // ) {
      //   ctx.save();
      //   ctx.textBaseline = 'middle';
      //   ctx.textAlign = 'center';
      //   ctx.font = `bold ${textSize + 2}px Arial`;
      //   ctx.strokeStyle = circleFillColor;
      //   ctx.strokeText(name, origin, origin);
      //   ctx.restore();
      // }

      // // Draw a text
      // ctx.save();
      // ctx.textBaseline = 'middle';
      // ctx.textAlign = 'center';
      // ctx.fillStyle = ;
      // ctx.font = `bold ${textSize}px Arial`;
      // ctx.strokeStyle = circleFillColor;
      // ctx.strokeText(name, origin, origin);
      // ctx.fillText(name, origin, origin);
      // ctx.restore();
    }

    styleCache[key] = canvas;
  }

  return styleCache[key];
};

let renderTimeout;
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
    const { coordinate, timeIntervals, timeOffset } = traj;

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

      const vehicleImg = style(
        traj,
        zoom,
        pixelRatio,
        hoverVehicleId,
        selectedVehicleId,
        delayDisplay,
        delayOutlineColor,
        useDelayStyle,
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
