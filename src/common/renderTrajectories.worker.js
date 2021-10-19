import { Point, LineString } from 'ol/geom';
import GeomType from 'ol/geom/GeometryType';
import {
  getRadius,
  getDelayColor,
  getDelayText,
  getBgColor,
  getTextColor,
  getTextSize,
} from './trackerConfig';

const styleCache = {};
const defaultStyle = (traj) => {
  // const { id: text } = traj;
  const text = 'la';
  if (styleCache[text]) {
    return styleCache[text];
  }
  const canvas = new OffscreenCanvas(15, 15);
  const ctx = canvas.getContext('2d');
  ctx.arc(8, 8, 5, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#8ED6FF';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();
  // ctx.font = 'bold 12px arial';
  // ctx.strokeStyle = 'white';
  // ctx.lineWidth = 3;
  // ctx.strokeText(text, 20, 10);
  // ctx.fillStyle = 'black';
  // ctx.fillText(text, 20, 10);
  styleCache[text] = canvas;
  return styleCache[text];
};

const style = (
  props,
  zoom,
  hoverVehicleId,
  selectedVehicleId,
  delayDisplay,
  delayOutlineColor,
  useDelayStyle,
) => {
  const {
    type,
    name,
    id,
    color,
    textColor,
    delay,
    cancelled,
    operatorProvidesRealtime,
  } = props;
  const z = Math.min(Math.floor(zoom || 1), 16);
  const hover = hoverVehicleId === id;
  const selected = selectedVehicleId === id;
  const key = `${z}${type}${name}${operatorProvidesRealtime}${delay}${hover}${selected}${cancelled}`;

  if (!styleCache[key]) {
    let radius = getRadius(type, z);
    const isDisplayStrokeAndDelay = radius >= 7;

    if (radius === 0) {
      styleCache[key] = null;
      return null;
    }

    if (hover || selected) {
      radius = isDisplayStrokeAndDelay ? radius + 5 : 14;
    }
    const margin = 1;
    const radiusDelay = radius + 2;
    const markerSize = radius * 2;

    const canvas = new OffscreenCanvas(
      radiusDelay * 2 + margin * 2 + 100,
      radiusDelay * 2 + margin * 2 + 100,
    );
    // add space for delay information
    const ctx = canvas.getContext('2d');
    const origin = canvas.width / 2;

    if (isDisplayStrokeAndDelay && delay !== null) {
      // Draw circle delay background
      ctx.save();
      ctx.beginPath();
      ctx.arc(origin, origin, radiusDelay, 0, 2 * Math.PI, false);
      ctx.fillStyle = getDelayColor(delay, cancelled);
      ctx.filter = 'blur(1px)';
      ctx.fill();
      ctx.restore();
    }

    // Show delay if feature is hovered or if delay is above 5mins.
    if (
      isDisplayStrokeAndDelay &&
      (hover || delay >= delayDisplay || cancelled)
    ) {
      // Draw delay text
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.max(
        cancelled ? 19 : 14,
        Math.min(cancelled ? 19 : 17, radius * 1.2),
      )}px arial, sans-serif`;
      ctx.fillStyle = getDelayColor(delay, cancelled, true);

      ctx.strokeStyle = delayOutlineColor;
      ctx.lineWidth = 1.5;
      const delayText = getDelayText(delay, cancelled);
      ctx.strokeText(delayText, origin + radiusDelay + margin, origin);
      ctx.fillText(delayText, origin + radiusDelay + margin, origin);
      ctx.restore();
    }

    // Draw colored circle with black border
    let circleFillColor;
    if (useDelayStyle) {
      circleFillColor = getDelayColor(delay, cancelled);
    } else {
      circleFillColor = color || getBgColor(type);
    }

    ctx.save();
    if (isDisplayStrokeAndDelay || hover || selected) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
    }
    ctx.fillStyle = circleFillColor;
    ctx.beginPath();
    ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    // Dashed outline if a provider provides realtime but we don't use it.
    if (
      isDisplayStrokeAndDelay &&
      useDelayStyle &&
      delay === null &&
      operatorProvidesRealtime === 'yes'
    ) {
      ctx.setLineDash([5, 3]);
    }
    if (isDisplayStrokeAndDelay || hover || selected) {
      ctx.stroke();
    }
    ctx.restore();

    // Draw text in the circle
    if (radius > 10) {
      const fontSize = Math.max(radius, 10);
      const textSize = getTextSize(ctx, markerSize, name, fontSize);

      // Draw a stroke to the text only if a provider provides realtime but we don't use it.
      if (
        useDelayStyle &&
        delay === null &&
        operatorProvidesRealtime === 'yes'
      ) {
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `bold ${textSize + 2}px Arial`;
        ctx.strokeStyle = circleFillColor;
        ctx.strokeText(name, origin, origin);
        ctx.restore();
      }

      // Draw a text
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = !useDelayStyle
        ? textColor || getTextColor(type)
        : '#000000';
      ctx.font = `bold ${textSize}px Arial`;
      ctx.strokeStyle = circleFillColor;
      ctx.strokeText(name, origin, origin);
      ctx.fillText(name, origin, origin);
      ctx.restore();
    }

    styleCache[key] = canvas;
  }

  return styleCache[key];
};
let canvas = null;
let idframe = null;

self.onmessage = function (evt) {
  // console.log('WOOOOOOORKER', evt.data);
  if (evt.data.canvas) {
    canvas = evt.data.canvas;
    return;
  }
  const [
    trajectories,
    currTime = Date.now(),
    size = [],
    resolution,
    interpolate = true,
    iconScale,
    hoverVehicleId,
    selectedVehicleId,
    extent,
    zoom,
    delayDisplay,
    delayOutlineColor,
    useDelayStyle,
  ] = evt.data;

  const canvasContext = canvas.getContext('2d');
  if (!canvasContext || !canvasContext.commit) {
    // console.log('pas de commoit');
  }
  self.cancelAnimationFrame(idframe);

  idframe = self.requestAnimationFrame(() => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    console.time('render');
    // this.clear();
    canvas.style.left = '0px';
    canvas.style.top = '0px';

    const [width, height] = size;
    if (
      width &&
      height &&
      (canvas.width !== width || canvas.height !== height)
    ) {
      [canvas.width, canvas.height] = [width, height];
    }

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
      const { timeIntervals, timeOffset } = traj;

      if (Array.isArray(geometry.coordinates)) {
        if (geometry.type === 'Point') {
          geometry = new Point(geometry.coordinates);
        } else if (geometry.type === 'LineString') {
          geometry = new LineString(geometry.coordinates);
        }
      }

      // if (this.filter && !this.filter(traj, i, this.trajectories)) {
      //   // eslint-disable-next-line no-continue
      //   continue;
      // }

      let coord = null;
      let rotation;

      if (traj.coordinate && !interpolate) {
        coord = traj.coordinate;
      } else if (timeIntervals && timeIntervals.length > 1) {
        const now = currTime - (timeOffset || 0);
        let start;
        let end;
        let startFrac;
        let endFrac;
        let timeFrac;

        // Search th time interval.
        for (let j = 0; j < timeIntervals.length - 1; j += 1) {
          // Rotation only available in tralis layer.
          [start, startFrac, rotation] = timeIntervals[j];
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
            [[, , rotation]] = timeIntervals;
            timeFrac = 0;
            coord = geometry.getFirstCoordinate();
          } else if (now > timeIntervals[timeIntervals.length - 1][0]) {
            [, , rotation] = timeIntervals[timeIntervals.length - 1];
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
        trajectories[i].rotation = rotation;
        trajectories[i].endFraction = timeFrac || 0;
      }

      if (coord) {
        // We set the rotation of the trajectory (used by tralis).
        // console.log(extent, canvas.width, canvas.width, coord);
        trajectories[i].coordinate = coord;
        const extentWidth = extent[2] - extent[0];
        const extentHeight = extent[3] - extent[1];
        const diffX = coord[0] - extent[0]; // 100* extent[0] / extent[2]
        const diffY = coord[1] - extent[1]; // 100* extent[0] / extent[2]
        const deltaX = (diffX / extentWidth) * canvas.width;
        const deltaY = canvas.height - (diffY / extentHeight) * canvas.height;

        const px = [deltaX, deltaY]; // this.getPixelFromCoordinate(coord);

        if (deltaX < 0 && deltaX > width && deltaY < 0 && deltaY > height) {
          // eslint-disable-next-line no-continue
          continue;
        }

        // console.log(px);
        // Trajectory with pixel (i.e. within map extent) will be in renderedTrajectories.
        trajectories[i].rendered = true;
        //   this.renderedTrajectories.push(this.trajectories[i]);
        const vehicleImg = style(
          traj,
          zoom,
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
          // requestAnimationFrame(() => {
          // console.log('icic');
          canvasContext.drawImage(
            vehicleImg,
            px[0] - imgWidth / 2,
            px[1] - imgHeight / 2,
            imgWidth,
            imgHeight,
          );
          // })
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
    console.timeEnd('render');
  });
  if (canvasContext.commit) canvasContext.commit();

  self.postMessage(canvas);
};
