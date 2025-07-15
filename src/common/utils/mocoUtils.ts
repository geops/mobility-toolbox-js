import { Feature } from 'ol';
import { getCenter } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import { toLonLat } from 'ol/proj';

import {
  MocoAffectedTimeInterval,
  MocoNotification,
  MocoNotificationFeatureProperties,
  MocoNotificationIconRefFeatureProperties,
} from '../../types';

export const getTime = (str: string) => {
  return parseInt(str?.substr(0, 8).replace(/:/g, ''), 10);
};

export const isNotificationNotOutOfDate = (
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

export const isNotificationPublished = (
  notification: MocoNotification,
  now: Date,
) => {
  if (!notification?.properties?.publications?.length) {
    // If there is no piblications date, use the time intervals
    return isNotificationActive(notification, now);
  }
  return notification.properties.publications.some((publication) => {
    return (
      now >= new Date(publication.visible_from) &&
      now <= new Date(publication.visible_until)
    );
  });
};

export const isNotificationActive = (
  notification: MocoNotification,
  now: Date,
) => {
  return notification.properties.affected_time_intervals.some(
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
  notification: MocoNotification,
  now: Date,
) => {
  const next = notification.properties.affected_time_intervals.reduce(
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

  const iconRefFeatures = notification.features
    .filter((f) => {
      return f.properties.is_icon_ref || f.geometry.type === 'Point';
    })
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
      if (!iconRefFeatureProperties.disruption_type) {
        iconRefFeatureProperties.disruption_type = 'OTHER';
      }
      // Set Banner image
      if (iconRefFeatureProperties.disruption_type) {
        iconRefFeatureProperties.disruption_type_banner =
          iconRefFeatureProperties.disruption_type + '_BANNER';
      }

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
