import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';

import MapsetKmlFormat from './MapsetKmlFormat';

describe('MapsetKmlFormat', () => {
  describe('zIndex roundtrip', () => {
    const buildLayer = (zIndex: number | undefined) => {
      const feature = new Feature({
        geometry: new Point([0, 0]),
        name: 'test',
      });
      if (zIndex !== undefined) {
        feature.set('zIndex', zIndex);
      }
      feature.setStyle(
        new Style({
          fill: new Fill({ color: [255, 0, 0, 1] }),
          stroke: new Stroke({ color: [0, 0, 0, 1], width: 1 }),
          zIndex: zIndex,
        }),
      );
      return new VectorLayer({
        source: new VectorSource({ features: [feature] }),
      });
    };

    it('should persist zIndex as ExtendedData in the KML string', () => {
      const format = new MapsetKmlFormat();
      const kml = format.writeFeatures(buildLayer(5), 'EPSG:3857', 1);
      expect(kml).toBeDefined();
      expect(kml).toMatch(
        /<Data name="zIndex">\s*<value>5<\/value>\s*<\/Data>/,
      );
    });

    it('should restore the feature zIndex property when reading back the KML', () => {
      const format = new MapsetKmlFormat();
      const kml = format.writeFeatures(buildLayer(7), 'EPSG:3857', 1);
      const features = format.readFeatures(kml!, {
        featureProjection: 'EPSG:3857',
      });
      expect(features.length).toBeGreaterThan(0);
      expect(parseInt(features[0].get('zIndex') as string, 10)).toBe(7);
    });

    it('should restore the style zIndex on the read feature', () => {
      const format = new MapsetKmlFormat();
      const kml = format.writeFeatures(buildLayer(3), 'EPSG:3857', 1);
      const features = format.readFeatures(kml!, {
        featureProjection: 'EPSG:3857',
      });
      const feature = features[0];
      const styleFn = feature.getStyleFunction();
      expect(styleFn).toBeDefined();
      const styles = styleFn!(feature, 1);
      const style = Array.isArray(styles) ? styles[0] : styles;
      expect(style?.getZIndex()).toBe(3);
    });

    it('should not add a zIndex ExtendedData when the feature has no zIndex', () => {
      const format = new MapsetKmlFormat();
      const kml = format.writeFeatures(buildLayer(undefined), 'EPSG:3857', 1);
      expect(kml).toBeDefined();
      expect(kml).not.toMatch(/<Data name="zIndex">/);
    });
  });
});
