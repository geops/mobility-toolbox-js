import { LineString } from 'ol/geom';

import type { Position } from 'geojson';
import type { Coordinate } from 'ol/coordinate';
import type { SimpleGeometry } from 'ol/geom';

import type { RealtimeTrajectory } from '../../types';

export interface VehiclePosition {
  coord?: Coordinate;
  rotation?: null | number;
}

/**
 * Interpolate or not the vehicle position from a trajectory at a specific date.
 *
 * @param {number} now Current date to interpolate a position with. In ms.
 * @param {RealtimeTrajectory} trajectory The trajectory to interpolate.
 * @param {boolean} noInterpolate If true, the vehicle position is not interpolated on each render but only once.
 * @returns {VehiclePosition}
 * @private
 */
const getVehiclePosition = (
  now: number,
  trajectory: {
    properties: {
      coordinate?: Coordinate;
      olGeometry?: SimpleGeometry;
    };
  } & RealtimeTrajectory,
  noInterpolate: boolean,
): VehiclePosition => {
  const {
    coordinate,
    olGeometry,
    time_intervals: timeIntervals,
  } = trajectory.properties;
  let { coordinates, type } = trajectory.geometry as
    | GeoJSON.LineString
    | GeoJSON.Point;
  let geometry = olGeometry;
  let coord;
  let rotation;

  // If an olGeometry exists we use it. It avoids to create one each time.
  if (geometry) {
    // @ts-expect-error improve types
    type = geometry.getType();
    coordinates = geometry.getCoordinates() ?? [];
  }

  if (noInterpolate && coordinate) {
    coord = coordinate;
  } else if (type === 'Point') {
    coord = coordinates as Position;
  } else if (type === 'LineString') {
    if (!geometry) {
      geometry = new LineString(coordinates);
    }
    const intervals = timeIntervals || [[]];
    const firstInterval = intervals[0];
    const lastInterval = intervals[intervals.length - 1];

    // Between the last time interval of a trajectory event and the beginning
    // of the new trajectory event, there is few seconds, can be 6 to 30
    // seconds (that's why the vehicle jumps sometimes).
    // So we make the choice here to display the last (or the first) position
    // of an trajectory event instead of removing them, if the current date is
    // outside the time intervals we display the vehicle at the last (or first) position known.
    if (firstInterval?.[0] && now < firstInterval[0]) {
      // Display first position known.
      [, , rotation] = firstInterval;
      coord = geometry.getFirstCoordinate();
    } else if (lastInterval?.[0] && now > lastInterval[0]) {
      // Display last position known.
      [, , rotation] = lastInterval;
      coord = geometry.getLastCoordinate();
    } else {
      // Interpolate position using time intervals.
      for (let j = 0; j < intervals.length - 1; j += 1) {
        // Rotation only available in realtime layer.
        const [start, startFrac] = intervals[j];
        const [end, endFrac] = intervals[j + 1];

        if (
          start &&
          end &&
          startFrac &&
          endFrac &&
          start <= now &&
          now <= end
        ) {
          // interpolate position inside the time interval.
          const timeFrac = Math.min((now - start) / (end - start), 1);
          const geomFrac = timeFrac * (endFrac - startFrac) + startFrac;
          coord = (geometry as LineString)?.getCoordinateAt(geomFrac);
          [, , rotation] = intervals[j];
          break;
        }
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
