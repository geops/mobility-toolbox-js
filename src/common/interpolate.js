import GeomType from 'ol/geom/GeometryType';

/**
 * Interpolate a position along a geometry at a specific date.
 *
 * @param {number} now Current date to interpolate a position with. In ms.
 * @param {ol/geom/LineString~LineString} geometry The geoemtry used to interpolate a position.
 * @param {Array<Array<number,number,number>>} timeIntervals The time intervals used to interpolate a position, ex: [[dateInMs, fraction, rotation]...].
 * @returns
 */
const interpolate = (now, geometry, timeIntervals) => {
  let coord;
  let start;
  let end;
  let startFrac;
  let endFrac;
  let timeFrac;
  let rotation;

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
      timeFrac = interpolate ? Math.min((now - start) / (end - start), 1) : 0;

      const geomFrac = interpolate
        ? timeFrac * (endFrac - startFrac) + startFrac
        : 0;

      coord = geometry.getCoordinateAt(geomFrac);

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
  return { coord, rotation, timeFrac };
};

export default interpolate;
