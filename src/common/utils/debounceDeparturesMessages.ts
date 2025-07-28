import sortAndFilterDepartures from './sortAndFilterDepartures';

import type { RealtimeAPIDeparturesById } from '../../api/RealtimeAPI';
import type {
  WebSocketAPIMessageCallback,
  WebSocketAPIMessageEventData,
} from '../../api/WebSocketAPI';
import type { RealtimeDeparture, RealtimeDepartureExtended } from '../../types';

/**
 * This function returns a WebSocket api callback, and call the onDeparturesUpdate function with the list of current departures to display.
 * @param {function(departures: RealtimeDeparture[])} onDeparturesUpdate callback when list of departures changes, called after 100 ms
 * @param {boolean} [sortByMinArrivalTime = true] Sort departures by arrival time
 * @param {number} [maxDepartureAge = 30] max departure age of departures in minutes
 * @param {number} [timeout = 100] debounce timeout in ms
 * @private
 */
const debounceDeparturesMessages = (
  onDeparturesUpdate: (departures: RealtimeDepartureExtended[]) => {},
  sortByMinArrivalTime = false,
  maxDepartureAge = 30,
  timeout = 100,
): WebSocketAPIMessageCallback<RealtimeDeparture> => {
  const departureUpdateTimeout: Record<string, number> = {};

  const departureObject: RealtimeAPIDeparturesById = {};

  return (data: WebSocketAPIMessageEventData<RealtimeDeparture>) => {
    const { content: departure, source } = data;
    if (departureUpdateTimeout[source]) {
      window.clearTimeout(departureUpdateTimeout[source]);
    }

    if (!departure) {
      return;
    }

    departureObject[departure.call_id] = departure;

    departureUpdateTimeout[source] = window.setTimeout(() => {
      const departures = sortAndFilterDepartures(
        departureObject,
        sortByMinArrivalTime || false,
        maxDepartureAge,
      );
      onDeparturesUpdate(departures);
    }, timeout);
  };
};

export default debounceDeparturesMessages;
