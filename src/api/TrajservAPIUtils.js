import { LineString } from 'ol/geom';

/**
 * Translate the response date object into a readable object.
 * @returns {array<Date>}
 * @private
 */
const translateDates = (dates) => {
  const newDates = [];

  for (let i = 0; i < dates.length; i += 1) {
    const { d: day, m: month, y: year } = dates[i];
    newDates.push({
      day,
      month,
      year,
    });
  }
  return newDates;
};

/**
 * Translate the trajstations response into a readable object.
 * @returns {Object} returns a readable object
 * @private
 */
export const translateTrajStationsResp = (data) => {
  const {
    id,
    hs: destination,
    t: vehicleType,
    ln: longName,
    sn: shortName,
    wa: wheelchairAccessible,
    ba: bicyclesAllowed,
    rt: realTime,
    fid: feedsId,
    rid: routeIdentifier,
    c: bgColor,
    tc: datacolor,
    a: { n: operator, u: operatorUrl, tz: operatorTimeZone },
    tt: {
      n: dateNotOperatingDays,
      p: dateAdditionalOperatingDays,
      t: operatingPeriod,
    },
    sts: dataStations,
  } = data;

  const notOperatingDays = translateDates(dateNotOperatingDays);
  const additionalOperatingDays = translateDates(dateAdditionalOperatingDays);
  const backgroundColor = bgColor && `#${bgColor}`;
  const color = datacolor && `#${datacolor}`;

  const stations = [];
  for (let i = 0; i < dataStations.length; i += 1) {
    const {
      sid: stationId,
      n: stationName,
      p: coordinates,
      at: arrivalTime,
      dt: departureTime,
      ap: arrivalDate,
      dp: departureDate,
      ad: arrivalDelay,
      dd: departureDelay,
      dot: noDropOff,
      put: noPickUp,
      c: cancelled,
      wa: stWheelchairAccessible,
    } = dataStations[i];

    stations.push({
      stationId,
      stationName,
      coordinates,
      arrivalTime: arrivalTime !== -1 ? arrivalDate * 1000 : null,
      departureTime: departureTime !== -1 ? departureDate * 1000 : null,
      arrivalDelay,
      departureDelay,
      noDropOff: !!noDropOff,
      noPickUp: !!noPickUp,
      cancelled: !!cancelled,
      wheelchairAccessible: !!stWheelchairAccessible,
    });
  }

  return {
    id,
    destination,
    backgroundColor,
    color,
    vehicleType,
    routeIdentifier,
    longName,
    shortName,
    stations,
    wheelchairAccessible: !!wheelchairAccessible,
    bicyclesAllowed: !!bicyclesAllowed,
    realTime,
    feedsId,
    operatingInformations: {
      operatingPeriod,
      notOperatingDays,
      additionalOperatingDays,
    },
    operator,
    operatorUrl,
    operatorTimeZone,
  };
};

/**
 * Translate the trajectory_collection response into a js usable object.
 * @returns {Array} returns an array of trajectories.
 * @private
 */
export const translateTrajCollResponse = (features) => {
  const trajectories = [];
  for (let i = 0; i < features.length; i += 1) {
    const traj = features[i];
    const geometry = new LineString(traj.geometry.coordinates);
    const {
      ID: id,
      ProductIdentifier: type,
      JourneyIdentifier: journeyIdentifier,
      PublishedLineName: name,
      RouteIdentifier: routeIdentifier,
      Operator: operator,
      TimeIntervals: timeIntervals,
      Color: color,
      TextColor: textColor,
      Delay: delay,
      Cancelled: cancelled,
    } = traj.properties;

    trajectories.push({
      id,
      type,
      name,
      color: color && `#${color}`,
      textColor: textColor && `#${textColor}`,
      delay,
      operator,
      journeyIdentifier,
      routeIdentifier,
      timeIntervals,
      geometry,
      cancelled,
    });
  }
  return trajectories;
};

export default {
  translateTrajCollResponse,
  translateTrajStationsResp,
};
