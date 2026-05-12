import sortAndfilterTimetableCall from './sortAndFilterTimetableCall';

import type { RealtimeAPIDeparturesById } from '../../api/RealtimeAPI';
import type {
  WebSocketAPIMessageCallback,
  WebSocketAPIMessageEventData,
} from '../../api/WebSocketAPI';
import type { RealtimeDeparture, RealtimeDepartureExtended } from '../../types';

/**
 * This function returns a WebSocket api callback, and call the onCallsUpdate function with the list of current calls and arrival to display.
 * @param {function(calls: RealtimeDepartureExtended[])} onCallsUpdate callback when timetable  changes, called after 100 ms
 * @param {boolean} [sortByMinArrivalTime = true] Sort calls by arrival time
 * @param {number} [maxDepartureAge = 30] max departure age of calls in minutes
 * @param {number} [timeout = 100] debounce timeout in ms
 * @private
 */
const debounceTimeTableMessages = (
  onCallsUpdate: (departures: RealtimeDepartureExtended[]) => unknown,
  sortByMinArrivalTime = false,
  maxDepartureAge = 30,
  timeout = 100,
): WebSocketAPIMessageCallback<RealtimeDeparture> => {
  const callUpdateTimeout: Record<string, number> = {};

  const callObject: RealtimeAPIDeparturesById = {};

  return (data: WebSocketAPIMessageEventData<RealtimeDeparture>) => {
    const { content: call, source } = data;
    if (callUpdateTimeout[source]) {
      window.clearTimeout(callUpdateTimeout[source]);
    }

    if (!call) {
      return;
    }

    callObject[call.call_id] = call;

    callUpdateTimeout[source] = window.setTimeout(() => {
      const calls = sortAndfilterTimetableCall(
        callObject,
        sortByMinArrivalTime || false,
        maxDepartureAge,
      );
      onCallsUpdate(calls);
    }, timeout);
  };
};

export default debounceTimeTableMessages;
