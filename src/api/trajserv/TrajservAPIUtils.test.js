import { translateTrajStationsResp } from './TrajservAPIUtils';

describe('TrajservAPIUtils', () => {
  describe('#translateTrajStationsResp', () => {
    test.only("should success even if data doesn't have all properties set", () => {
      const empty = {
        backgroundColor: undefined,
        bicyclesAllowed: false,
        color: undefined,
        destination: undefined,
        feedsId: undefined,
        id: undefined,
        longName: undefined,
        operatingInformations: {
          additionalOperatingDays: [],
          notOperatingDays: [],
          operatingPeriod: undefined,
        },
        operator: undefined,
        operatorTimeZone: undefined,
        operatorUrl: undefined,
        publisher: undefined,
        publisherTimeZone: undefined,
        publisherUrl: undefined,
        realTime: undefined,
        routeIdentifier: undefined,
        shortName: undefined,
        stations: [],
        vehicleType: undefined,
        wheelchairAccessible: false,
      };
      let a = translateTrajStationsResp({});
      expect(a).toEqual(empty);
      a = translateTrajStationsResp(null);
      expect(a).toEqual(empty);
      a = translateTrajStationsResp(undefined);
      expect(a).toEqual(empty);
    });
  });
});
