import { getCenter } from 'ol/extent';
import GeoJSONFormat from 'ol/format/GeoJSON';
import { v4 as uuid } from 'uuid';

import type { LineString } from 'ol/geom';

import type {
  MocoNotificationFeatureCollectionToRender,
  MocoNotificationFeatureToRender,
} from '../../ol/layers/MocoLayer';
import type { SituationType } from '../../types';

export const getTime = (str: string) => {
  return parseInt(str?.substr(0, 8).replace(/:/g, ''), 10);
};
const geojson = new GeoJSONFormat();

/**
 * Determines if the current date is within an affected time intervals of a situation.
 */
export const isMocoSituationAffected = (
  situation: Partial<SituationType>,
  now: Date = new Date(),
) => {
  return !!situation.affectedTimeIntervals?.some((affectedTimeInterval) => {
    const {
      dailyEndTime = '',
      dailyStartTime = '',
      endTime,
      startTime,
    } = affectedTimeInterval as {
      dailyEndTime?: string;
      dailyStartTime?: string;
      endTime: string;
      startTime: string;
    };
    const nowTime = getTime(now.toTimeString());
    const dailyStart = getTime(dailyStartTime);
    const dailyEnd = getTime(dailyEndTime);
    const inRange = new Date(startTime) <= now && now <= new Date(endTime);
    return dailyStart && dailyEnd
      ? inRange && dailyStart <= nowTime && nowTime <= dailyEnd
      : inRange;
  });
};

/**
 * Determines if the current date is within a publication windows of a situation.
 */
export const isMocoSituationPublished = (
  situation: Partial<SituationType>,
  now: Date = new Date(),
) => {
  const publicationWindows =
    situation.publicationWindows ??
    situation.publications?.flatMap((publication) => {
      return publication.publicationWindows ?? [];
    }) ??
    [];
  if (!publicationWindows.length) {
    // If there are no publication windows, use the time intervals
    return !!isMocoSituationAffected(situation, now);
  }
  return !!publicationWindows.some(
    ({ endTime, startTime }: { endTime: string; startTime: string }) => {
      return new Date(startTime) <= now && now <= new Date(endTime);
    },
  );
};

// export const getMocoStartsString = (
//   notificationProperties: MocoNotificationProperties,
//   now: Date,
// ) => {
//   const next = notificationProperties.affected_time_intervals.reduce(
//     (
//       a: MocoDefinitions['AffectedTimeIntervals'],
//       b: MocoDefinitions['AffectedTimeIntervals'],
//     ) => {
//       const aEnd = new Date(a.end);
//       const aStart = new Date(a.start);
//       const bStart = new Date(b.start);
//       return now < aEnd && aStart < bStart ? a : b;
//     },
//     {} as MocoDefinitions['AffectedTimeIntervals'],
//   );
//   const nextStartDate = new Date(next.start);
//   let starts;
//   if (
//     now.toDateString() === nextStartDate.toDateString() ||
//     now.getTime() - nextStartDate.getTime() > 0
//   ) {
//     if (next.time_of_day_start) {
//       starts = `ab ${next.time_of_day_start.substr(0, 5)}`;
//     } else {
//       starts = `ab ${nextStartDate.toLocaleTimeString(['de'], {
//         hour: '2-digit',
//         hour12: false,
//         minute: '2-digit',
//       })}`;
//     }
//   } else {
//     starts = `ab ${nextStartDate.toLocaleDateString(['de-DE'], {
//       day: 'numeric',
//       month: 'short',
//     })}`;
//   }
//   return starts;
// };

export const getMocoIconRefFeature = (
  publicationLineFeature: MocoNotificationFeatureToRender,
): MocoNotificationFeatureToRender => {
  const geometry = geojson.readGeometry(
    publicationLineFeature.geometry,
  ) as LineString;

  const center = getCenter(geometry.getExtent());
  const icon: MocoNotificationFeatureToRender = {
    geometry: {
      coordinates: geometry.getClosestPoint(center),
      type: 'Point',
    },
    id: uuid(),
    properties: {
      ...publicationLineFeature.properties,
      geometry: undefined, // to avoid ol problems
    },
    type: 'Feature',
  };
  return icon;
};

const to4326 = (
  geometry3857: GeoJSON.LineString | GeoJSON.Point,
): GeoJSON.LineString | GeoJSON.Point => {
  return geojson.writeGeometryObject(
    geojson.readGeometry(geometry3857, {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:4326',
    }),
  ) as GeoJSON.LineString | GeoJSON.Point;
};

export const getMocoReasonCategoryImageName = (
  categoryName = 'undefiniert',
) => {
  return categoryName
    .toLowerCase()
    .replace(/\s/g, '_')
    .replace(/ü/g, 'ue')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ß/g, 'ss');
};

/**
 * This function return a FeatureCollection representing a Situation,
 * This feature collection contains a feature for each affectd lines and stops.
 * This also creates an icon for each affected line if hasIcon property is true.
 */
export const getFeatureCollectionToRenderFromSituation = (
  situation: Partial<SituationType>,
  date: Date = new Date(),
): MocoNotificationFeatureCollectionToRender => {
  const features: MocoNotificationFeatureToRender[] = [];
  const reasonCategoryImageName = getMocoReasonCategoryImageName(
    situation.reasons?.[0]?.categoryName,
  );

  const situationRenderProps = {
    reasonCategoryImageName,
    reasons: situation.reasons,
    // for backward compatibility
    reasons_category: reasonCategoryImageName,
  };

  situation?.publications?.forEach((publication) => {
    const isAffected = isMocoSituationAffected(situation, date);
    const isPublished = isMocoSituationPublished(situation, date);

    const publicationRenderProps = {
      // for backward compatibility with v1
      condition_group: publication.serviceConditionGroup.toLowerCase(),
      // for backward compatibility with v1
      isActive: isAffected,
      isAffected,
      isPublished,
      serviceCondition: publication.serviceCondition,
      serviceConditionGroup: publication.serviceConditionGroup,
      severity: publication.severity,
      // for backward compatibility with v1
      severity_group: publication.severityGroup?.toLocaleLowerCase(),
      severityGroup: publication.severityGroup,
    };

    publication.publicationLines?.forEach((publicationLine) => {
      publicationLine.lines.forEach((line) => {
        line.geometry.forEach(
          ({
            geom,
            graph,
          }: {
            geom: GeoJSON.LineString | GeoJSON.Point;
            graph: string;
          }) => {
            const feature: MocoNotificationFeatureToRender = {
              geometry: to4326(geom),
              id: uuid(),
              properties: {
                graph,
                hasIcon: publicationLine.hasIcon,
                line,
                mot: publicationLine.mot,
                // We pass the ids to be able to identify the publication and the situation related to
                publicationId: publication.id,
                situationId: situation.id!,
                ...situationRenderProps,
                ...publicationRenderProps,
                geometry: undefined, // to avoid conflict with ol geometry property
              },
              type: 'Feature',
            };
            features.push(feature);

            if (publicationLine.hasIcon) {
              const iconFeature = getMocoIconRefFeature(feature);
              iconFeature.properties.situationId = situation.id!; // make the sure the situation is passed
              features.push(iconFeature);
            }
          },
        );
      });
    });
    publication.publicationStops?.forEach((publicationStop) => {
      publicationStop.geometry.forEach(
        ({
          geom,
          graph,
        }: {
          geom: GeoJSON.LineString | GeoJSON.Point;
          graph: string;
        }) => {
          const feature: MocoNotificationFeatureToRender = {
            geometry: to4326(geom),
            id: uuid(),
            properties: {
              graph,
              name: publicationStop.name,
              publicationId: publication.id,
              publicationStopId: publicationStop.id,
              situationId: situation.id!,
              ...situationRenderProps,
              ...publicationRenderProps,
              geometry: undefined, // to avoid conflict with ol geometry property
            },
            type: 'Feature',
          };
          features.push(feature);
        },
      );
    });
  });
  return {
    features,
    type: 'FeatureCollection',
  };
};

// export const getMocoSituationsAsFeatureCollection = (
//   situations: MocoSituationToRender[],
// ): MocoNotificationAsFeatureCollection => {
//   situations.forEach((situation) => {});

//   // Merge all features into a single GeoJSON feature collection
//   // and add the notification properties to each feature.

//   const features = notifications.flatMap((notification) => {
//     return (notification.features || []).map((feature) => {
//       const feat: MocoNotificationFeature = {
//         ...feature,
//         properties: {
//           ...notification.properties,
//           ...feature.properties,
//         },
//       };
//       const reasonCategoryName =
//         notification.properties.reasons?.[0]?.category_name;

//       // reasons_category is used to choose the proper icon in the style
//       // @ts-expect-error the value is a string in the style
//       feat.properties.reasons_category =
//         MOCO_IMAGE_BY_CATEGORY[
//           reasonCategoryName || MOCO_REASONS_CATEGORY.UNDEFINIERT
//         ] || MOCO_IMAGE_BY_CATEGORY[MOCO_REASONS_CATEGORY.UNDEFINIERT];

//       return feat;
//     });
//   });

//   return {
//     // @ts-expect-error conflict between geometry types
//     features,
//     type: 'FeatureCollection',
//   };
// };
