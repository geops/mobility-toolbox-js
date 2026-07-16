import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";

import MapsetKmlFormat from "./MapsetKmlFormat";

describe("MapsetKmlFormat", () => {
  describe("zIndex roundtrip", () => {
    const buildLayer = (zIndex: number | undefined) => {
      const feature = new Feature({
        geometry: new Point([0, 0]),
        name: "test",
      });
      if (zIndex !== undefined) {
        feature.set("zIndex", zIndex);
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

    it("should persist zIndex as ExtendedData in the KML string", () => {
      const format = new MapsetKmlFormat();
      const kml = format.writeFeatures(buildLayer(5), "EPSG:3857", 1);
      expect(kml).toBeDefined();
      expect(kml).toMatch(
        /<Data name="zIndex">\s*<value>5<\/value>\s*<\/Data>/,
      );
    });

    it("should restore the feature zIndex property when reading back the KML", () => {
      const format = new MapsetKmlFormat();
      const kml = format.writeFeatures(buildLayer(7), "EPSG:3857", 1);
      const features = format.readFeatures(kml!, {
        featureProjection: "EPSG:3857",
      });
      expect(features.length).toBeGreaterThan(0);
      expect(features[0].get("zIndex")).toBe(7);
    });

    it("should restore the style zIndex on the read feature", () => {
      const format = new MapsetKmlFormat();
      const kml = format.writeFeatures(buildLayer(3), "EPSG:3857", 1);
      const features = format.readFeatures(kml!, {
        featureProjection: "EPSG:3857",
      });
      const feature = features[0];
      const styleFn = feature.getStyleFunction();
      expect(styleFn).toBeDefined();
      const styles = styleFn!(feature, 1);
      const style = Array.isArray(styles) ? styles[0] : styles;
      expect(style?.getZIndex()).toBe(3);
    });

    it("should not add a zIndex ExtendedData when the feature has no zIndex", () => {
      const format = new MapsetKmlFormat();
      const kml = format.writeFeatures(buildLayer(undefined), "EPSG:3857", 1);
      expect(kml).toBeDefined();
      expect(kml).not.toMatch(/<Data name="zIndex">/);
    });
  });

  describe("readFeatures from a KML string", () => {
    const kmlString = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Test document</name>
    <Placemark>
      <name>My point</name>
      <ExtendedData>
        <Data name="zIndex"><value>4</value></Data>
        <Data name="minZoom"><value>10</value></Data>
        <Data name="maxZoom"><value>18</value></Data>
      </ExtendedData>
      <Style>
        <IconStyle>
          <scale>1</scale>
          <Icon>
            <href>https://example.com/icon.png</href>
          </Icon>
        </IconStyle>
      </Style>
      <Point>
        <coordinates>7.4474,46.9481</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>My line</name>
      <Style>
        <LineStyle>
          <color>ff0000ff</color>
          <width>3</width>
        </LineStyle>
      </Style>
      <LineString>
        <coordinates>7.4474,46.9481 8.5417,47.3769</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

    it("should read all placemarks from the KML string", () => {
      const format = new MapsetKmlFormat();
      const features = format.readFeatures(kmlString, {
        featureProjection: "EPSG:3857",
      });
      expect(features.length).toBe(2);
    });

    it("should read a Point feature with its name and projected geometry", () => {
      const format = new MapsetKmlFormat();
      const features = format.readFeatures(kmlString, {
        featureProjection: "EPSG:3857",
      });
      const point = features[0];
      expect(point.get("name")).toBe("My point");
      const geom = point.getGeometry();
      expect(geom?.getType()).toBe("Point");
      const [x, y] = (geom as Point).getCoordinates();
      // The KML coordinates (7.4474, 46.9481) should be reprojected
      // from EPSG:4326 to EPSG:3857 (values in the millions of meters).
      expect(x).toBeGreaterThan(800000);
      expect(x).toBeLessThan(900000);
      expect(y).toBeGreaterThan(5900000);
      expect(y).toBeLessThan(6000000);
    });

    it("should apply ExtendedData zIndex, minZoom and maxZoom as feature properties", () => {
      const format = new MapsetKmlFormat();
      const features = format.readFeatures(kmlString, {
        featureProjection: "EPSG:3857",
      });
      const point = features[0];
      expect(point.get("zIndex")).toBe(4);
      expect(point.get("minZoom")).toBe(10);
      expect(point.get("maxZoom")).toBe(18);
    });

    it("should read a LineString feature with its stroke style", () => {
      const format = new MapsetKmlFormat();
      const features = format.readFeatures(kmlString, {
        featureProjection: "EPSG:3857",
      });
      const line = features[1];
      expect(line.get("name")).toBe("My line");
      expect(line.getGeometry()?.getType()).toBe("LineString");

      const styleFn = line.getStyleFunction();
      expect(styleFn).toBeDefined();
      const styles = styleFn!(line, 1);
      const style = Array.isArray(styles) ? styles[0] : styles;
      const stroke = style?.getStroke();
      expect(stroke).toBeDefined();
      expect(stroke?.getWidth()).toBe(3);
    });
  });
});
