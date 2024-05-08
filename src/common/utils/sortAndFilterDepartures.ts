import { RealtimeAPIDeparturesById } from '../../api/RealtimeAPI';
import type { RealtimeDepartureExtended } from '../../types';
import compareDepartures from './compareDepartures';

/**
 * This function sort Departures by arrival time and filter out unwanted departures:
 *  - when dparture time is in the past
 *  - when departure are duplicated
 *  - when departure is not in the next 30 min
 *
 * @param {Object} depObject The object containing departures by id.
 * @param {boolean} [sortByMinArrivalTime=false] If true sort departures by arrival time.
 * @return {RealtimeDeparture[]} Return departures array.
 * @private
 */
const sortAndfilterDepartures = (
  depObject: RealtimeAPIDeparturesById,
  sortByMinArrivalTime: boolean = false,
  maxDepartureAge: number = 30,
): RealtimeDepartureExtended[] => {
  const departures = Object.keys(depObject).map((k) => depObject[k]);
  departures.sort((a, b) => compareDepartures(a, b, sortByMinArrivalTime));

  const futureDate = new Date();
  futureDate.setMinutes(futureDate.getMinutes() + maxDepartureAge);
  const future = futureDate.getTime();

  const pastDate = new Date();
  pastDate.setMinutes(pastDate.getMinutes() - maxDepartureAge);
  const past = pastDate.getTime();

  const departureArray = [];
  const platformsBoarding: string[] = [];
  let previousDeparture = null;

  for (let i = departures.length - 1; i >= 0; i -= 1) {
    const departure: RealtimeDepartureExtended = {
      ...departures[i],
    };
    const time = new Date(departure.time).getTime();

    // Only show departures within the next 30 minutes
    if (time > past && time < future) {
      // If 2 trains are boarding at the same platform,
      // remove the older one.
      if (departure.state === 'BOARDING') {
        if (!platformsBoarding.includes(departure.platform)) {
          platformsBoarding.push(departure.platform);
        } else {
          departure.state = 'HIDDEN';
        }
      }

      // If two trains with the same line number and destinatin
      // and a departure difference < 1 minute, hide the second one.
      if (
        previousDeparture &&
        departure.to[0] === previousDeparture.to[0] &&
        Math.abs(time - previousDeparture.time) < 1000 &&
        departure.line.name === previousDeparture.line.name
      ) {
        departure.state = 'HIDDEN';
      }

      if (/(STOP_CANCELLED|JOURNEY_CANCELLED)/.test(departure.state)) {
        departure.cancelled = true;
      }

      previousDeparture = departure;
      previousDeparture.time = time;
      departureArray.unshift(departure);
    }
  }

  return departureArray;
};

export default sortAndfilterDepartures;
