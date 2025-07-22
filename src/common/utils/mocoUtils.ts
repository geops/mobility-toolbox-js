import { Feature } from 'ol';
import { getCenter } from 'ol/extent';
import GeoJSON, { GeoJSONGeometry } from 'ol/format/GeoJSON';
import { toLonLat } from 'ol/proj';

import {
  MocoDefinitions,
  MocoNotification,
  MocoNotificationFeature,
  MocoNotificationFeatureProperties,
  MocoNotificationProperties,
} from '../../types';

export type MocoNotificationAsFeature = GeoJSON.Feature<
  GeoJSONGeometry,
  MocoNotificationFeatureProperties & MocoNotificationProperties
>;

export type MocoNotificationAsFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSONGeometry,
  MocoNotificationFeatureProperties & MocoNotificationProperties
>;

export const MOCO_REASONS_CATEGORY = {
  DAS_PERSONAL_BETREFEND: 'Das Personal betreffend',
  SICHERHEITSRELEVANT: 'Sicherheitsrelevant',
  SPEZIELLE_ANLAESSE: 'Spezielle Anl\u00E4sse',
  TECHNISCHE_PROBLEME: 'Technische Probleme',
  UMWELTEINFLUESSE: 'Umwelteinflüsse',
  UNDEFINIERT: 'Undefiniert',
  UNFALL: 'Unfall',
  VERKEHRLICHE_GRUENDE: 'Verkehrliche Gr\u00FCnde',
  VERSCHIEDENES: 'Verschiedenes',
};

export const MOCO_IMAGE_BY_CATEGORY = {
  [MOCO_REASONS_CATEGORY.DAS_PERSONAL_BETREFEND]: 'das_personal_betrefend',
  [MOCO_REASONS_CATEGORY.SICHERHEITSRELEVANT]: 'sicherheitsrelevant',
  [MOCO_REASONS_CATEGORY.SPEZIELLE_ANLAESSE]: 'spezielle_anlaesse',
  [MOCO_REASONS_CATEGORY.TECHNISCHE_PROBLEME]: 'technische_probleme',
  [MOCO_REASONS_CATEGORY.UMWELTEINFLUESSE]: 'umwelteinfluesse',
  [MOCO_REASONS_CATEGORY.UNDEFINIERT]: 'undefiniert',
  [MOCO_REASONS_CATEGORY.UNFALL]: 'unfall',
  [MOCO_REASONS_CATEGORY.VERKEHRLICHE_GRUENDE]: 'verkehrliche_gruende',
  [MOCO_REASONS_CATEGORY.VERSCHIEDENES]: 'verschiedenes',
};

export const getTime = (str: string) => {
  return parseInt(str?.substr(0, 8).replace(/:/g, ''), 10);
};

export const isMocoNotificationNotOutOfDate = (
  notification: MocoNotification,
  now: Date = new Date(),
) => {
  // TODO: The backend should be responsible to returns only good notifications.
  let notOutOfDate = notification.properties.affected_time_intervals.some(
    (ati) => {
      return now < new Date(ati.end);
    },
  );
  if (!notOutOfDate) {
    notOutOfDate = (notification.properties.publications || []).some(
      (publication) => {
        return (
          now >= new Date(publication.visible_from) &&
          now <= new Date(publication.visible_until)
        );
      },
    );
  }
  return notOutOfDate;
};

export const isMocoNotificationPublished = (
  notificationProperties: MocoNotificationProperties,
  now: Date,
) => {
  if (!notificationProperties?.publications?.length) {
    // If there is no piblications date, use the time intervals
    return isMocoNotificationActive(notificationProperties, now);
  }
  return notificationProperties.publications.some((publication) => {
    return (
      now >= new Date(publication.visible_from) &&
      now <= new Date(publication.visible_until)
    );
  });
};

export const isMocoNotificationActive = (
  notificationProperties: MocoNotificationProperties,
  now: Date,
) => {
  return notificationProperties.affected_time_intervals.some(
    (affectedTimeInterval) => {
      const {
        end,
        start,
        time_of_day_end: dayTimeEnd,
        time_of_day_start: dayTimeStart,
      } = affectedTimeInterval;
      const nowTime = getTime(now.toTimeString());
      const startTime = getTime(dayTimeStart || '');
      const endTime = getTime(dayTimeEnd || '');
      const inRange = new Date(start) <= now && now <= new Date(end);
      return startTime && endTime
        ? inRange && startTime <= nowTime && nowTime <= endTime
        : inRange;
    },
  );
};

export const getMocoStartsString = (
  notificationProperties: MocoNotificationProperties,
  now: Date,
) => {
  const next = notificationProperties.affected_time_intervals.reduce(
    (
      a: MocoDefinitions['AffectedTimeIntervals'],
      b: MocoDefinitions['AffectedTimeIntervals'],
    ) => {
      const aEnd = new Date(a.end);
      const aStart = new Date(a.start);
      const bStart = new Date(b.start);
      return now < aEnd && aStart < bStart ? a : b;
    },
    {} as MocoDefinitions['AffectedTimeIntervals'],
  );
  const nextStartDate = new Date(next.start);
  let starts;
  if (
    now.toDateString() === nextStartDate.toDateString() ||
    now.getTime() - nextStartDate.getTime() > 0
  ) {
    if (next.time_of_day_start) {
      starts = `ab ${next.time_of_day_start.substr(0, 5)}`;
    } else {
      starts = `ab ${nextStartDate.toLocaleTimeString(['de'], {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
      })}`;
    }
  } else {
    starts = `ab ${nextStartDate.toLocaleDateString(['de-DE'], {
      day: 'numeric',
      month: 'short',
    })}`;
  }
  return starts;
};

export const getMocoIconRefFeatures = (
  notification: MocoNotification,
): MocoNotificationFeature[] => {
  const format = new GeoJSON();

  const features = notification.features || [];
  const lineFeatures: MocoNotificationFeature[] = features.filter((f) => {
    return f.geometry?.type !== 'Point';
  });

  let lineFeaturesUsedForIcons = lineFeatures.filter((f) => {
    return f.properties.is_icon_ref;
  });

  // If no icon ref defined we use the first one
  if (lineFeaturesUsedForIcons.length === 0 && lineFeatures.length > 0) {
    lineFeaturesUsedForIcons = [features[0]];
  }

  const iconsForLines = lineFeaturesUsedForIcons
    .map((affectedLine) => {
      const affectedLineFeature = format.readFeature(affectedLine, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }) as Feature;

      const geometry = affectedLineFeature.getGeometry();

      if (!geometry) {
        return null;
      }

      const center = getCenter(geometry.getExtent());
      const iconRefPoint = geometry.getClosestPoint(center);

      const iconRefFeatureProperties: MocoNotificationFeatureProperties = {
        ...notification.properties,
        ...affectedLine.properties,
      };

      // if (!iconRefFeatureProperties.disruption_type) {
      //   iconRefFeatureProperties.disruption_type = 'OTHER';
      // }

      // // Set Banner image
      // if (iconRefFeatureProperties.disruption_type) {
      //   iconRefFeatureProperties.disruption_type_banner =
      //     iconRefFeatureProperties.disruption_type + '_BANNER';
      // }

      if (iconRefPoint) {
        const iconForLine: MocoNotificationAsFeature = {
          geometry: {
            coordinates: toLonLat(iconRefPoint),
            type: 'Point',
          },
          id: Math.random() + '',
          properties: iconRefFeatureProperties,
          type: 'Feature',
        };
        return iconForLine;
      }
    })
    .filter((f) => {
      return !!f;
    });

  // @ts-expect-error bad geometry type from backend
  return iconsForLines;
};

export const getMocoNotificationsAsFeatureCollection = (
  notifications: MocoNotification[],
): MocoNotificationAsFeatureCollection => {
  // Merge all features into a single GeoJSON feature collection
  // and add the notification properties to each feature.

  const features = notifications.flatMap((notification) => {
    return (notification.features || []).map((feature) => {
      const feat: MocoNotificationFeature = {
        ...feature,
        properties: {
          ...notification.properties,
          ...feature.properties,
        },
      };
      const reasonCategoryName =
        notification.properties.reasons?.[0]?.category_name;

      // reasons_category is used to choose the proper icon in the style
      // @ts-expect-error the value is a string in the style
      feat.properties['reasons_category'] =
        MOCO_IMAGE_BY_CATEGORY[
          reasonCategoryName || MOCO_REASONS_CATEGORY.UNDEFINIERT
        ] || MOCO_IMAGE_BY_CATEGORY[MOCO_REASONS_CATEGORY.UNDEFINIERT];

      return feat;
    });
  });

  return {
    // @ts-expect-error conflict between geometry types
    features,
    type: 'FeatureCollection',
  };
};

export const getCurrentGraph = (mapping: object, zoom: number) => {
  const breakPoints = Object.keys(mapping).map((k) => {
    return parseFloat(k);
  });
  const closest = breakPoints.reverse().find((bp) => {
    return bp <= Math.floor(zoom) - 1;
  }); // - 1 due to ol zoom !== mapbox zoom
  // @ts-expect-error the value is a number in der style
  return mapping[closest || Math.min(...breakPoints)];
};
