import GeomType from 'ol/geom/GeometryType';

/**
 * Interpolate or not the vehicle position from a trajectory at a specific date.
 *
 * @param {number} now Current date to interpolate a position with. In ms.
 * @param {TralisTrajectory} trajectory The trajectory to interpolate.
@returns
 */
const getVehiclePosition = (now, trajectory, noInterpolate) => {
  const {
    time_intervals: timeIntervals,
    olGeometry: geometry,
    coordinate,
  } = trajectory.properties;

  let coord;
  let rotation;

  if (noInterpolate && coordinate) {
    coord = coordinate;
  } else if (geometry.getType() === GeomType.POINT) {
    coord = geometry.getCoordinates();
  } else if (geometry.getType() === GeomType.LINE_STRING) {
    const intervals = timeIntervals || [];
    // Search the time interval.
    for (let j = 0; j < intervals.length - 1; j += 1) {
      // Rotation only available in tralis layer.
      const [start, startFrac] = intervals[j];
      const [end, endFrac] = intervals[j + 1];

      if (start <= now && now <= end) {
        // interpolate position inside the time interval.
        const timeFrac = Math.min((now - start) / (end - start), 1);
        const geomFrac = timeFrac * (endFrac - startFrac) + startFrac;
        coord = geometry.getCoordinateAt(geomFrac);
        [, , rotation] = intervals[j];
        break;
      }
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(
      'This geometry type is not supported. Only Point or LineString are. Current geometry: ',
      geometry,
    );
  }

  return { coord, rotation };
};

export default getVehiclePosition;
