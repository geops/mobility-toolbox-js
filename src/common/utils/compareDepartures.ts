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
    aDuration = new Date(a.min_arrival_time || a.time).getTime() - now;
    bDuration = new Date(b.min_arrival_time || b.time).getTime() - now;
  } else {
    aDuration = new Date(a.time).getTime() - now;
    bDuration = new Date(b.time).getTime() - now;
  }

  return aDuration - bDuration;
};

export default compareDepartures;
