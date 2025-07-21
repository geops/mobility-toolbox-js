import { Feature } from 'ol';
import { getCenter } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import { toLonLat } from 'ol/proj';

import {
  MocoAffectedTimeInterval,
  MocoNotification,
  MocoNotificationAsFeatureCollection,
  MocoNotificationIconRefFeatureProperties,
  MocoNotificationProperties,
} from '../../types';

export const getTime = (str: string) => {
  return parseInt(str?.substr(0, 8).replace(/:/g, ''), 10);
};

const REASONS_CATEGORY = {
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
    notOutOfDate = notification.properties.publications.some((publication) => {
      return (
        now >= new Date(publication.visible_from) &&
        now <= new Date(publication.visible_until)
      );
    });
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
    (a: MocoAffectedTimeInterval, b: MocoAffectedTimeInterval) => {
      const aEnd = new Date(a.end);
      const aStart = new Date(a.start);
      const bStart = new Date(b.start);
      return now < aEnd && aStart < bStart ? a : b;
    },
    {} as MocoAffectedTimeInterval,
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
): GeoJSON.Feature<
  GeoJSON.Geometry,
  MocoNotificationIconRefFeatureProperties
>[] => {
  const format = new GeoJSON();

  let iconRefFeatures = notification.features.filter((f) => {
    return f.properties.is_icon_ref || f.geometry.type === 'Point';
  });

  // If no icon ref defined we use the first one
  if (iconRefFeatures.length === 0 && notification.features.length > 0) {
    iconRefFeatures = [notification.features[0]];
  }

  iconRefFeatures = iconRefFeatures
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

      const iconRefFeatureProperties: MocoNotificationIconRefFeatureProperties =
        {
          ...notification.properties,
          ...affectedLine.properties,
          isIconRefPoint: true,
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
        const iconRefFeature = {
          geometry: {
            coordinates: toLonLat(iconRefPoint),
            type: 'Point',
          },
          id: Math.random() + '',
          properties: iconRefFeatureProperties,
          type: 'Feature',
        } as GeoJSON.Feature<
          GeoJSON.Geometry,
          MocoNotificationIconRefFeatureProperties
        >;
        return iconRefFeature;
      }
    })
    .filter((f) => {
      return !!f;
    });

  return iconRefFeatures;
};

export const getMocoNotificationsAsFeatureCollection = (
  notifications: MocoNotification[],
): MocoNotificationAsFeatureCollection => {
  // Merge all features into a single GeoJSON feature collection
  // and add the notification properties to each feature.

  const features = notifications.flatMap((notification) => {
    return notification.features.map((feature) => {
      const feat = {
        ...feature,
        properties: {
          ...notification.properties,
          ...feature.properties,
        },
      };
      const reasonName = notification.properties.reasons?.[0]?.name;
      const reasonCategoryName =
        notification.properties.reasons?.[0]?.category_name;
      const severity = feature.properties.severity;
      const serviceConditionGroup = feature.properties.condition_group;
      let severityGroup = feature.properties.severity_group;
      if (!severity) {
        severityGroup = 'undefined';
      }

      // console.log(
      //   'Reason name: ',
      //   reasonName,
      //   ' - Reason Category Name : ',
      //   reasonCategoryName,
      //   ' - Service Condition Group: ',
      //   serviceConditionGroup,
      //   ' - Severity: ',
      //   severity,
      //   ' - Severity Group: ',
      //   severityGroup,
      // );

      // Default image :)
      let iconImage = 'undefined';
      let lineWidth = 5;
      let lineColor = 'rgba(0, 0, 0)';

      if (reasonName === 'Bauarbeiten') {
        iconImage = 'constructionWork';
      } else {
        switch (reasonCategoryName) {
          case REASONS_CATEGORY.DAS_PERSONAL_BETREFEND:
            iconImage = 'staffConcerned';
            break;
          case REASONS_CATEGORY.SICHERHEITSRELEVANT:
            iconImage = 'securityAlert';
            break;
          case REASONS_CATEGORY.SPEZIELLE_ANLAESSE:
            iconImage = 'specialEvent';
            break;
          case REASONS_CATEGORY.TECHNISCHE_PROBLEME:
            iconImage = 'technicalProblem';
            break;
          case REASONS_CATEGORY.UMWELTEINFLUESSE:
            iconImage = 'enviromentalImpact';
            break;
          case REASONS_CATEGORY.UNDEFINIERT:
            iconImage = 'undefined';
            break;
          case REASONS_CATEGORY.UNFALL:
            iconImage = 'accident';
            break;
          case REASONS_CATEGORY.VERKEHRLICHE_GRUENDE:
            iconImage = 'trafficReason';
            break;
          case REASONS_CATEGORY.VERSCHIEDENES:
            iconImage = 'miscellanous';
            break;
          default:
            iconImage = 'undefined';
        }
      }

      if (!feat.properties.isActive && feat.properties.isPublished) {
        iconImage += '_future';
      } else if (feat.properties.isActive) {
        if (severityGroup === 'high') {
          iconImage += '_high';
        } else if (severityGroup === 'low' || severityGroup === 'undefined') {
          iconImage += '_low';
        } else if (severityGroup === 'normal') {
          if (serviceConditionGroup === 'disruption') {
            iconImage += '_high';
          } else if (serviceConditionGroup === 'information') {
            iconImage += '_low';
          } else {
            iconImage += '_medium';
          }
        } else {
          iconImage += '_medium';
        }
      }

      if (/high/.test(iconImage)) {
        lineColor = 'rgba(255, 0, 0)';
      }

      if (/low/.test(iconImage)) {
        lineWidth = 0; // hidden
      }

      // @ts-expect-error the value is a string in the style
      feat.properties['icon-image'] = iconImage;
      // @ts-expect-error the value is a string in the style
      feat.properties['line-color'] = lineColor;
      // @ts-expect-error the value is a string in the style
      feat.properties['line-width'] = lineWidth;
      // @ts-expect-error the value is a string in the style
      feat.properties['severityGroup'] = severityGroup;

      return feat;
    });
  });

  return {
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
