import compareDepartures from './compareDepartures';

import type { RealtimeAPIDeparturesById } from '../../api/RealtimeAPI';
import type { RealtimeDepartureExtended } from '../../types';

/**
 * This function sort Departures by arrival time and filter out unwanted departures:
 *  - when dparture time is in the past
 *  - when departure are duplicated
 *  - when departure is not in the next 30 min
 *
 * @param {Object} depObject The object containing departures by id.
 * @param {boolean} [sortByMinArrivalTime=false] If true sort departures by arrival time.
 * @param {number} [maxDepartureAge=30] The maximum departure age in minutes.
 * @return {RealtimeDeparture[]} Return departures array.
 * @private
 */
const sortAndfilterTimetableCall = (
  depObject: RealtimeAPIDeparturesById,
  sortByMinArrivalTime = false,
  maxDepartureAge = 30,
): RealtimeDepartureExtended[] => {
  const calls = Object.keys(depObject).map((k) => {
    return depObject[k];
  });
  calls.sort((a, b) => {
    return compareDepartures(a, b, sortByMinArrivalTime);
  });

  const futureDate = new Date();
  futureDate.setMinutes(futureDate.getMinutes() + maxDepartureAge);
  const future = futureDate.getTime();

  const pastDate = new Date();
  pastDate.setMinutes(pastDate.getMinutes() - maxDepartureAge);
  const past = pastDate.getTime();

  const callsArray = [];
  const platformsBoarding: string[] = [];
  let previousCall = null;

  for (let i = calls.length - 1; i >= 0; i -= 1) {
    const call: RealtimeDepartureExtended = {
      ...calls[i],
    };

    const chosenTime = call.time ?? call.arrivalTime;

    if (!chosenTime) {
      // eslint-disable-next-line no-console
      console.warn('Call without time found, skipping it.', call);
      continue;
    }

    const time = new Date(chosenTime).getTime();

    // Only show departures within the next 30 minutes
    if (time > past && time < future) {
      // If 2 trains are boarding at the same platform,
      // remove the older one.
      if (call.state === 'BOARDING') {
        if (call.platform && !platformsBoarding.includes(call.platform)) {
          platformsBoarding.push(call.platform);
        } else {
          call.state = 'HIDDEN';
        }
      }

      // If two trains with the same line number and destinatin
      // and a departure difference < 1 minute, hide the second one.
      if (
        previousCall &&
        call.to[0] === previousCall.to[0] &&
        Math.abs(time - (previousCall.time || 0)) < 1000 &&
        call.line.name === previousCall.line.name
      ) {
        call.state = 'HIDDEN';
      }

      if (/(STOP_CANCELLED|JOURNEY_CANCELLED)/.test(call.state)) {
        call.cancelled = true;
      }

      previousCall = call;
      previousCall.time = time;
      callsArray.unshift(call);
    }
  }

  return callsArray;
};

export default sortAndfilterTimetableCall;
