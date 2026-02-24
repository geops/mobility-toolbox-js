import type { RealtimeDeparture } from '../../types';

/**
 * Compare two given departures for sort alogithm,
 * @param {RealtimeDeparture} a First departure.
 * @param {RealtimeDeparture} b Second departure.
 * @param {boolean} [sortByMinArrivalTime=false] Sort departures by arrival time.
 * @private
 */
const compareDepartures = (
  a: RealtimeDeparture,
  b: RealtimeDeparture,
  sortByMinArrivalTime = false,
): number => {
  // First LEAVING and HIDDEN, then BOARDING and then sorted by time.
  const topStates = ['HIDDEN', 'LEAVING', 'BOARDING'];
  const aTop = a.has_fzo && topStates.includes(a.state);
  const bTop = b.has_fzo && topStates.includes(b.state);

  if (aTop || bTop) {
    if (aTop !== bTop) {
      return aTop ? -1 : 1;
    }

    if (a.state !== b.state) {
      // one is leaving
      return topStates.indexOf(a.state) - topStates.indexOf(b.state);
    }
  }

  let aDuration = null;
  let bDuration = null;
  const now = Date.now();

  if (sortByMinArrivalTime) {
    const aTime = a.min_arrival_time || a.time;
    const bTime = b.min_arrival_time || b.time;
    if (!aTime && !bTime) {
      return 0;
    }
    if (!aTime) {
      return 1;
    }
    if (!bTime) {
      return -1;
    }
    if (aTime && bTime) {
      aDuration = new Date(aTime).getTime() - now;
      bDuration = new Date(bTime).getTime() - now;
    }
  } else {
    if (!a.time && !b.time) {
      return 0;
    }
    if (!a.time) {
      return 1;
    }
    if (!b.time) {
      return -1;
    }
    if (a.time && b.time) {
      aDuration = new Date(a.time).getTime() - now;
      bDuration = new Date(b.time).getTime() - now;
    }
  }
  if (!aDuration && !bDuration) {
    return 0;
  }
  if (!aDuration) {
    return 1;
  }
  if (!bDuration) {
    return -1;
  }

  return aDuration - bDuration;
};

export default compareDepartures;
