/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface Paths {
  '/': {
    /** Returns a stop (or multiple) as GeoJSON FeatureCollection */
    get: {
      parameters: {
        query: {
          /**
           * left,bottom,right,up coordinates in WGS84 wherein the
           * station should lie
           */
          bbox?: string;
          /** which field to look up, default: all of them */
          field?: 'coords' | 'id' | 'name';
          /** Control how many matches will be returned */
          limit?: number;
          /**
           * comma seperated list of mot's which should be available
           * at the stop
           */
          mots?:
            | 'bus'
            | 'cable_car'
            | 'ferry'
            | 'funicular'
            | 'gondola'
            | 'rail'
            | 'subway'
            | 'tram';
          /**
           * comma seperated list, order chooses which agency will be preferred
           * as ident_source (for id and code fields)
           */
          prefagencies?: 'db' | 'sbb';
          /** Anything you'd like to search for */
          q: string;
          /**
           * Coordinates in WGS84 (in lat,lon order) used to rank stops close to
           * this position higher
           */
          ref_location?: string;
        };
      };
      responses: {
        /** stop(s) */
        200: {
          schema: {
            features?: {
              /** @description the coordinates of the stop */
              geometry?: {
                /**
                 * @example [
                 *   7.439119,
                 *   46.94882
                 * ]
                 */
                coordinates?: number[];
                /** @enum {string} */
                type?: 'Point';
              };
              properties?: {
                /**
                 * @description Abbreviation code from the transport agency (e.g. DS100 for Deutsche Bahn)
                 *
                 * @example BN
                 */
                code?: string;
                /**
                 * @description 2 letter country code where the station is located
                 * @example CH
                 */
                country_code?: string;
                /**
                 * @description uic number
                 * @example 8507000
                 */
                id?: string;
                /**
                 * @description source agency for id and code (see below)
                 * @example sbb
                 */
                ident_source?: string;
                /** @description ifopt identifier, if available */
                ifopt?: string;
                /** @description Means of transport that are available at this station */
                mot?: {
                  bus?: boolean;
                  cable_car?: boolean;
                  ferry?: boolean;
                  funicular?: boolean;
                  gondola?: boolean;
                  rail?: boolean;
                  subway?: boolean;
                  tram?: boolean;
                };
                /**
                 * @description name of the stop
                 * @example Bern
                 */
                name?: string;
                /**
                 * @description how well the result matches your query, 0
                 * means best
                 */
                rank?: number;
                /**
                 * @description array of translations of the stopname
                 * @default []
                 */
                translated_names?: {
                  /** @enum {string} */
                  language?: 'de' | 'en' | 'fr' | 'it';
                  value?: string;
                }[];
                /** @description internal ID */
                uid?: string;
              };
              /** @enum {string} */
              type?: 'Feature';
            }[];
            /** @enum {string} */
            type?: 'FeatureCollection';
          };
        };
        /** limit parameter too high */
        400: {
          schema: {
            /** @enum {string} */
            error?: '400 Bad Request: Limit has to be an integer between 1 and 500';
          };
        };
      };
    };
  };
}

export interface Operations {}

export interface External {}
