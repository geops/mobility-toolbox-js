/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface Paths {
  '/': {
    /** Returns a route as GeoJSON */
    get: {
      parameters: {
        query: {
          /**
           * Whether to use beelines (line strings with 2 points) between
           * mutually unreachable hops as a fallback for "Route not found"
           * errors. "true", "on", "yes", "y", "1" will enable the
           * fallback. Default: enabled
           */
          'beeline-fallback'?: string;
          /**
           * Distance punishment factor for edge snapping of coordinates (see
           * "Note on coordinates" at the top). Large: prefer close edge. Small:
           * prefer short total route. Negative value: like worst edge
           * category. Default: -1.0
           */
          'coord-punish'?: number;
          /**
           * Search radius for candidate edges during snapping of coordinates
           * (see "Note on coordinates" at the top) Default: -1.0
           */
          'coord-radius'?: number;
          /** Only for mot=rail. Default is a detailed network based on OpenStreetMap. gen1 to gen4 provide rail networks with increasing levels of generalization */
          graph?: 'gen1' | 'gen2' | 'gen3' | 'gen4';
          /**
           * Whether to include intermediate hops (stations/stops) found on the
           * route to the response. "true", "on", "yes", "y", "1" will enable
           * intermediate hops. Default: disabled
           */
          hops?: string;
          /** A line name that should be preferred */
          line?: string;
          /** Name of origin of the preferred line */
          'line-from'?: string;
          /** Name of destination of the preferred line */
          'line-to'?: string;
          /**
           * Maximum allowed ratio of hops to skip if not found. Only non-start
           * and non-end hops are counted in ratio numerator and denominator.
           */
          'max-skip-hop-ratio'?: number;
          /** Mode of transport */
          mot:
            | 'bus'
            | 'car'
            | 'coach'
            | 'ferry'
            | 'foot'
            | 'funicular'
            | 'gondola'
            | 'rail'
            | 'subway'
            | 'tram';
          /** Douglas-Peucker distance parameter for simplification. Default 0.5 in Mercator units */
          simplify?: number;
          /**
           * A pipe separated list of hops. A hop describes a station with either
           *  - a name or abbreviation
           *  - a station id, prefixed with `!`
           *  - comma-seperated coordinates starting with geographic latitude followed by longitude, prefixed with `@`
           *  - an additional platform code, prefixed with `$`
           *
           *  Station names do not need to match exactly the names in the
           *  database that is used for routing. The correct names are searched
           *  for by simple normalization, by lookup of synonyms or abbreviation
           *  as well as fuzzy algorithms.
           *
           *  The usage of different schemes of IDs used by the transit agencies
           *  is handled to a large part. A station can be found by all IDs that
           *  we know for it. E.g. the station Basel Bad can be found with the ID
           *  8500090 that is used by Swiss Federal Railways SBB and by 8518816,
           *  the number used by German Railways DB. Also the usage of numbers
           *  used by the UIC is supported for many stations. If you need an
           *  additional numbering scheme please contact us.
           *
           *  Note on coordinates:
           *    If you do not prefix the coordinate pair with `@`, no snapping to
           *    the next station is performed. Instead the route will forcefully
           *    traverse the specified point.
           *
           * Note on mot's "foot" and "car":
           *    Some features might not be available, such as "line-from",
           *    "line-to", because they dont apply to those means of transport.
           *
           *  Examples for a single hop:
           *  - `@47.37811,8.53935` a station at position 47.37811, 8.53935
           *  - `basel sbb` a station named "basel sbb"
           *  - `ZUE`, station "Zürich HB" by its common abbreviation
           *  - `Zürich Hauptbahnhof` or `HBF Zürich` are all valid synonyms für "Zürich HB"
           *  - `!8596126` a station with id 8596126
           *  - `basel sbb$4` track 4 in a station "Basel SBB"
           *  - `@47.37811,8.53935$4` track 4 in a station at position 47.37811, 8.53935
           *  - `zürich hb@47.37811,8.53935$8` track 8 in station "Zürich HB" at position 47.37811, 8.53935
           *
           *  Example for a valid via with three hops:
           *  - `freiburg|basel%20sbb|bern` - from Freiburg (Breisgau) Hbf via Basel SBB to Bern
           */
          via: string;
          /**
           * Whether to output OSM way ids in Feature properties.
           * "true", "on", "yes", "y", "1" will enable output. Default: disabled
           */
          'way-ids'?: string;
        };
      };
      responses: {
        /** A route */
        200: {
          schema: {
            features?: {
              geometry?: {
                /**
                 * @example [
                 *   [
                 *     7.8958421,
                 *     47.9816362
                 *   ],
                 *   [
                 *     7.9048287,
                 *     47.9796056
                 *   ]
                 * ]
                 */
                coordinates?: number[][];
                /** @enum {string} */
                type?: 'LineString';
              };
              properties?: {
                lines?: {
                  /** @example ICE */
                  name?: string;
                  /** @example 0.99 */
                  prop?: number;
                }[];
              };
              station_from?: {
                /**
                 * @description IBNR
                 * @example
                 */
                id?: string;
                /** @description Latitude of the stop, in WGS84 */
                latitude?: number;
                /** @description Latitude of the stop, in WGS84 */
                longitude?: number;
                /** @example Freiburg Littenweiler */
                name?: string;
                /** @example 1 */
                platform?: string;
              };
              station_to?: {
                /**
                 * @description IBNR
                 * @example 8004158
                 */
                id?: string;
                /** @description Latitude of the stop, in WGS84 */
                latitude?: number;
                /** @description Latitude of the stop, in WGS84 */
                longitude?: number;
                /** @example Muenchen Pasing */
                name?: string;
                /** @example 4 */
                platform?: string;
              };
              /** @enum {string} */
              type?: 'Feature';
            };
            properties?: {
              lines?: {
                /** @example ICE */
                name?: string;
                /** @example 0.99 */
                prop?: number;
              }[];
              /**
               * @description routing was done on this graph
               * @example osm-eu-rail
               */
              network?: string;
              /**
               * @description via's you passed as a parameter but were
               * skipped when routing (maybe because they were not found)
               */
              skippedVias?: string[];
            };
            /** @enum {string} */
            type?: 'FeatureCollection';
          };
        };
      };
    };
  };
}

export interface Operations {}

export interface External {}
