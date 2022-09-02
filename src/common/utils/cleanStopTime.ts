import { RealtimeStopSequence } from '../../types';

/**
 * Remove the delay from arrivalTime and departureTime
 * @private
 */
const cleanStopTime = (content: RealtimeStopSequence): RealtimeStopSequence => {
  content.stations.forEach((station) => {
    // eslint-disable-next-line no-param-reassign
    station.arrivalTimeWithDelay = station.arrivalTime;
    if (station.departureTime) {
      // eslint-disable-next-line no-param-reassign
      station.departureTimeWithDelay = station.departureTime;
    }
    if (station.arrivalDelay) {
      // eslint-disable-next-line no-param-reassign
      station.arrivalTime -= station.arrivalDelay;
      if (station.departureTime) {
        // eslint-disable-next-line no-param-reassign
        station.departureTime -= station.arrivalDelay;
      }
    }
  });
  // eslint-disable-next-line consistent-return
  return content;
};

export default cleanStopTime;
