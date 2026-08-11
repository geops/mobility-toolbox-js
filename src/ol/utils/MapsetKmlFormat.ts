import { Feature, getUid } from "ol";
import { asString } from "ol/color";
import KML from "ol/format/KML";
import CircleGeom from "ol/geom/Circle";
import GeometryCollection from "ol/geom/GeometryCollection";
import MultiPoint from "ol/geom/MultiPoint";
import Point from "ol/geom/Point";
import { fromCircle } from "ol/geom/Polygon";
import { get, transform } from "ol/proj";
import { Circle, Fill, Icon, Stroke, Style, Text } from "ol/style";
import { parse } from "ol/xml";

import { asFloat, asFloatArray, asInteger, asIntegerArray } from "../../common";
import {
  asJson,
  getNameFromString,
  getTextArrayFromString,
  getTextFontFromString,
} from "../../common/utils/kmlUtils";

import getPolygonPattern from "./getMapsetPolygonPattern";

import type { Feature as FeatureType } from "ol";
import type { Color } from "ol/color";
import type { ColorLike } from "ol/colorlike";
import type { Coordinate } from "ol/coordinate";
import type { FeatureLike } from "ol/Feature";
import type { ReadOptions, WriteOptions } from "ol/format/Feature";
import type { SimpleGeometry } from "ol/geom";
import type { Vector } from "ol/layer";
import type { ProjectionLike } from "ol/proj";
import type { Size } from "ol/size";
import type VectorSource from "ol/source/Vector";
import type {
  GeometryFunction,
  StyleFunction,
  StyleLike,
} from "ol/style/Style";

import type { PolygonFillPatternInput } from "./getMapsetPolygonPattern";

const CIRCLE_GEOMETRY_CENTER = "circleGeometryCenter";
const CIRCLE_GEOMETRY_RADIUS = "circleGeometryRadius";

export const FeatureProperty = {
  CircleGeometryCenter: CIRCLE_GEOMETRY_CENTER,
  CircleGeometryRadius: CIRCLE_GEOMETRY_RADIUS,
  Description: "description",
  FillPattern: "fillPattern",
  IconRotation: "iconRotation",
  IconScale: "iconScale",
  LineCap: "lineCap",
  LineDash: "lineDash",
  LineDashOffset: "lineDashOffset",
  LineEndIcon: "lineEndIcon",
  LineJoin: "lineJoin",
  LineStartIcon: "lineStartIcon",
  MaxZoom: "maxZoom",
  MinZoom: "minZoom",
  MiterLimit: "miterLimit",
  Name: "name",
  PictureOptions: "pictureOptions",
  TextAlign: "textAlign",
  TextArray: "textArray",
  TextBackgroundFillColor: "textBackgroundFillColor",
  TextFont: "textFont",
  TextOffsetX: "textOffsetX",
  TextOffsetY: "textOffsetY",
  TextPadding: "textPadding",
  TextRotation: "textRotation",
  TextStrokeColor: "textStrokeColor",
  TextStrokeWidth: "textStrokeWidth",
  ZIndex: "zIndex",
} as const;

const NO_STYLE_PROPERTIES = [
  FeatureProperty.CircleGeometryCenter,
  FeatureProperty.CircleGeometryRadius,
  FeatureProperty.Description,
  "geometry",
  FeatureProperty.Name,
];

export type FeatureProperty =
  (typeof FeatureProperty)[keyof typeof FeatureProperty];

const EPSG_4326 = get("EPSG:4326") as ProjectionLike;

// Default style for KML layer
const kmlFill = new Fill({
  color: [255, 0, 0, 0.7],
});
const kmlStroke = new Stroke({
  color: [255, 0, 0, 1],
  width: 1.5,
});
const kmlcircle = new Circle({
  fill: kmlFill,
  radius: 7,
  stroke: kmlStroke,
});
const kmlStyle = new Style({
  fill: kmlFill,
  image: kmlcircle,
  stroke: kmlStroke,
  text: new Text({
    fill: kmlFill,
    font: "normal 16px Helvetica",
    stroke: new Stroke({
      color: [255, 255, 255, 1],
      width: 3,
    }),
  }),
});

interface IconOptions {
  scale: number;
  size: [number, number];
  url: string;
  zIndex: number;
}

// Comes from ol >= 6.7,
// https://github.com/openlayers/openlayers/blob/main/src/ol/format/KML.js#L320
const scaleForSize = (size: Size) => {
  return 32 / Math.min(size[0], size[1]);
};

const applyTextStyleForIcon = (olIcon: Icon, olText: Text) => {
  const size = olIcon.getSize() || [48, 48];
  const scale = (olIcon.getScale() || 1) as number;
  const anchor = olIcon.getAnchor() || [
    (size[0] * scale) / 2,
    (size[1] * scale) / 2,
  ];
  const offset = [
    scale * (size[0] - anchor[0]) + 5,
    scale * (size[1] / 2 - anchor[1]),
  ];
  olText.setOffsetX(offset[0]);
  olText.setOffsetY(offset[1]);
  olText.setTextAlign("left");
};

const getVertexCoord = (
  geom: null | SimpleGeometry | undefined,
  start = true,
  index = 0,
): Coordinate | undefined => {
  const coords: Coordinate[] | null | undefined = geom?.getCoordinates();
  if (!coords) {
    return undefined;
  }
  const len = coords.length - 1;
  return start ? coords[index] : coords[len - index];
};

const getLineIcon = (
  feature: FeatureLike,
  icon: IconOptions,
  color: Color,
  start = true,
) => {
  const geom = feature.getGeometry();
  const coordA = getVertexCoord(geom as SimpleGeometry, start, 1);
  const coordB = getVertexCoord(geom as SimpleGeometry, start);
  if (!coordA || !coordB) {
    return new Style();
  }
  const dx = start ? coordA[0] - coordB[0] : coordB[0] - coordA[0];
  const dy = start ? coordA[1] - coordB[1] : coordB[1] - coordA[1];
  const rotation = Math.atan2(dy, dx);

  return new Style({
    geometry: (feat) => {
      const ge = feat.getGeometry();
      return new Point(getVertexCoord(ge as SimpleGeometry, start)!);
    },
    image: new Icon({
      color,
      rotateWithView: true,
      rotation: -rotation,
      scale: icon.scale,
      size: icon.size, // ie 11
      src: icon.url,
    }),
    zIndex: asInteger(feature.get(FeatureProperty.ZIndex) as string),
  });
};

export type MapsetKmlFormatReadOptions = {
  applyMinMaxZoom?: boolean;
  doNotRevert32pxScaling?: boolean;
  getResolutionForZoom?: (zoom: number) => number;
} & ReadOptions;

export type MapsetKmlFormatWriteOptions = {
  /** Property-name patterns that can be written as KML <ExtendedData>. */
  allowedProperties?: RegExp[];
  /** Map resolution used when evaluating style functions during export. */
  resolution?: number;
} & WriteOptions;

export interface PictureOptions {
  defaultScale?: number;
  resolution: number;
}

class MapsetKmlFormat {
  /**
   * Read a KML string.
   *
   * @param {String} kmlString A string representing a KML file.
   * @param {Object} formatOptions  used to read and writes features. It extends the ol KML format read options with some custom options.
   * @param {boolean} [formatOptions.applyMinMaxZoom=true] Generate a style function to apply the minZoom and maxZoom properties of features if they are defined and if the getResolutionForZoom function is provided in options. The style function will return undefined for features that are out of the zoom range defined by minZoom and maxZoom, so they will not be displayed on the map.
   * @param {boolean} [formatOptions.doNotRevert32pxScaling=false] Set it to true if you use ol < 6.7 and last version of react-spatial, Fix the 32px scaling, introduced by (ol >= 6.7), see https://github.com/openlayers/openlayers/pull/12695.
   * @param {function} [formatOptions.getResolutionForZoom] A function to get the resolution for a given zoom level. Mandatory if applyMinMaxZoom is true. It can be the map.getView().getResolutionForZoom function.
   */
  public readFeatures(
    kmlString: string,
    formatOptions: MapsetKmlFormatReadOptions = {},
  ): FeatureType[] {
    // Since ol 6.7, the KML follows better the spec and GoogleEarth interpretation, see https://github.com/openlayers/openlayers/pull/12695.
    // so the <scale> value is interpreted using an image size of 32px.
    // So when revert32pxScaling is true we fix back the scale, to use only, if you use an OL < 6.7.
    // Now the writeFeatures function use the iconScale extended data to set the image's scale.
    // If the extended data is not found it will look at this boolean to define if we must revert the scale or not.
    const { featureProjection = EPSG_4326 }: MapsetKmlFormatReadOptions =
      formatOptions;
    const features = new KML().readFeatures(kmlString, formatOptions);
    features.forEach((feature) => {
      // Transform back polygon to circle geometry
      const {
        [CIRCLE_GEOMETRY_CENTER]: circleGeometryCenter,
        [CIRCLE_GEOMETRY_RADIUS]: circleGeometryRadius,
      } = feature?.getProperties() || {};
      if (feature && circleGeometryCenter && circleGeometryRadius) {
        const circle = new CircleGeom(
          transform(
            JSON.parse(circleGeometryCenter as string) as Coordinate,
            EPSG_4326,
            featureProjection,
          ),
          parseFloat(circleGeometryRadius as string),
        );

        circle.setProperties(feature?.getGeometry()?.getProperties() ?? {});
        feature.setGeometry(circle);
      }

      this.sanitizeFeature(feature, formatOptions);
    });

    return features;
  }

  /**
   * Removes the <Camera> tag from a KML string. Returns the KML string with removed <Camera> tag.
   * @param {String} kmlString A string representing a KML file.
   */
  removeDocumentCamera(kmlString: string) {
    const kmlDoc = parse(kmlString);
    // Remove old Camera node
    const oldCameraNode = kmlDoc.getElementsByTagName("Camera")[0];
    if (oldCameraNode) {
      oldCameraNode.remove();
    }
    return new XMLSerializer().serializeToString(kmlDoc);
  }

  public sanitizeFeature(
    feature: FeatureType,
    formatOptions: MapsetKmlFormatReadOptions,
  ) {
    const {
      applyMinMaxZoom = true,
      doNotRevert32pxScaling = false,
      getResolutionForZoom,
    } = formatOptions;
    const geom = feature.getGeometry();
    let styles: StyleLike | undefined = feature.getStyleFunction();

    // Convert back feature properties used in writeFeatures
    if (feature.get(FeatureProperty.Name)) {
      feature.set(
        FeatureProperty.Name,
        getNameFromString(feature.get(FeatureProperty.Name) as string),
      );
    }
    if (feature.get(FeatureProperty.MaxZoom) !== undefined) {
      feature.set(
        FeatureProperty.MaxZoom,
        asFloat(feature.get(FeatureProperty.MaxZoom) as string),
      );
    }

    if (feature.get(FeatureProperty.MinZoom) !== undefined) {
      feature.set(
        FeatureProperty.MinZoom,
        asFloat(feature.get(FeatureProperty.MinZoom) as string),
      );
    }

    if (feature.get(FeatureProperty.ZIndex) !== undefined) {
      feature.set(
        FeatureProperty.ZIndex,
        asInteger(feature.get(FeatureProperty.ZIndex) as string),
      );
    }

    if (feature.get(FeatureProperty.FillPattern)) {
      feature.set(
        FeatureProperty.FillPattern,
        asJson<PolygonFillPatternInput>(
          feature.get(FeatureProperty.FillPattern) as string,
        ),
      );
    }

    if (feature.get(FeatureProperty.PictureOptions)) {
      feature.set(
        FeatureProperty.PictureOptions,
        asJson<PictureOptions>(
          feature.get(FeatureProperty.PictureOptions) as string,
        ),
      );
    }
    // END convert back feature properties used in writeFeatures

    // Start setting the correct types for the existing feature's properties
    if (feature.get(FeatureProperty.TextRotation) !== undefined) {
      feature.set(
        FeatureProperty.TextRotation,
        asFloat(feature.get(FeatureProperty.TextRotation) as string),
      );
    }

    if (feature.get(FeatureProperty.TextArray)) {
      feature.set(
        FeatureProperty.TextArray,
        getTextArrayFromString(
          feature.get(FeatureProperty.TextArray) as string,
        ),
      );
    }
    if (feature.get(FeatureProperty.TextStrokeWidth) !== undefined) {
      feature.set(
        FeatureProperty.TextStrokeWidth,
        asFloat(feature.get(FeatureProperty.TextStrokeWidth) as string),
      );
    }
    if (feature.get(FeatureProperty.TextOffsetX) !== undefined) {
      feature.set(
        FeatureProperty.TextOffsetX,
        asFloat(feature.get(FeatureProperty.TextOffsetX) as string),
      );
    }

    if (feature.get(FeatureProperty.TextOffsetY) !== undefined) {
      feature.set(
        FeatureProperty.TextOffsetY,
        asFloat(feature.get(FeatureProperty.TextOffsetY) as string),
      );
    }

    //textStrokeColor is a string, no need to convert it
    //textBackgroundFillColor is a string, no need to convert it

    if (feature.get(FeatureProperty.TextPadding)) {
      feature.set(
        FeatureProperty.TextPadding,
        asFloatArray(feature.get(FeatureProperty.TextPadding) as string),
      );
    }

    if (feature.get(FeatureProperty.IconRotation) !== undefined) {
      feature.set(
        FeatureProperty.IconRotation,
        asFloat(feature.get(FeatureProperty.IconRotation) as string),
      );
    }

    if (feature.get(FeatureProperty.IconScale) !== undefined) {
      feature.set(
        FeatureProperty.IconScale,
        asFloat(feature.get(FeatureProperty.IconScale) as string),
      );
    }

    // lineStartIcon
    // lineEndIcon
    if (feature.get(FeatureProperty.LineDash)) {
      feature.set(
        FeatureProperty.LineDash,
        asIntegerArray(feature.get(FeatureProperty.LineDash) as string),
      );
    }

    if (feature.get(FeatureProperty.LineDashOffset)) {
      feature.set(
        FeatureProperty.LineDashOffset,
        asInteger(feature.get(FeatureProperty.LineDashOffset) as string),
      );
    }

    if (feature.get(FeatureProperty.MiterLimit)) {
      feature.set(
        FeatureProperty.MiterLimit,
        asInteger(feature.get(FeatureProperty.MiterLimit) as string),
      );
    }
    // END

    // At this point the feature have correct properties types,
    // we can now set the correct style function on the feature,
    // depending on these properties.

    // The use of clone is part of the scale fix for OL > 6.7
    // If an IconStyle has no gx:w and gx:h defined, a scale factor is applied
    // after the image is loaded. To avoided having the scale factor applied we
    // clone the style and keep the scale as it is.
    // Having gx:w and gx:h not defined should not happen, using the last version of the parser/reader.
    const tmpStyles = styles?.(feature, 1);
    const style = (
      Array.isArray(tmpStyles) ? tmpStyles[0] : tmpStyles
    )?.clone();

    if (feature.get(FeatureProperty.ZIndex) !== undefined) {
      style?.setZIndex(feature.get(FeatureProperty.ZIndex) as number);
    }

    let stroke = style?.getStroke();

    if (feature.get(FeatureProperty.LineCap)) {
      stroke?.setLineCap(feature.get(FeatureProperty.LineCap) as CanvasLineCap);
    }

    if (feature.get(FeatureProperty.LineJoin)) {
      stroke?.setLineJoin(
        feature.get(FeatureProperty.LineJoin) as CanvasLineJoin,
      );
    }

    if (feature.get(FeatureProperty.LineDash) !== undefined) {
      stroke?.setLineDash(feature?.get(FeatureProperty.LineDash) as number[]);
    }

    if (feature.get(FeatureProperty.LineDashOffset) !== undefined) {
      stroke?.setLineDashOffset(
        feature.get(FeatureProperty.LineDashOffset) as number,
      );
    }

    if (feature.get(FeatureProperty.MiterLimit) !== undefined) {
      stroke?.setMiterLimit(feature.get(FeatureProperty.MiterLimit) as number);
    }

    // The canvas draws a stroke width=1 by default if width=0, so we
    // remove the stroke style in that case.
    if (stroke?.getWidth() === 0) {
      stroke = undefined;
    }

    // if the feature is a Point and we are offline, we use default vector
    // style.
    // if the feature is a Point and has a name with a text style, we
    // create a correct text style.
    // TODO Handle GeometryCollection displaying name on the first Point
    // geometry.
    if (style && (geom instanceof Point || geom instanceof MultiPoint)) {
      let image = style.getImage();
      let text = null;
      let fill = style.getFill();

      // If the feature has name we display it on the map as Google does
      if (
        feature.get(FeatureProperty.Name) &&
        style.getText() &&
        style.getText()?.getScale() !== 0
      ) {
        if (image?.getScale() === 0) {
          // transparentCircle is used to allow selection
          image = new Circle({
            fill: new Fill({ color: [0, 0, 0, 0] }),
            radius: 1,
            stroke: new Stroke({ color: [0, 0, 0, 0] }),
          });
        }

        // For backward compatibility we translate the bold and italic textFont property to a textArray prop
        const font =
          (feature.get(FeatureProperty.TextFont) as string) ||
          "normal 16px Arial";

        // Since we use rich text in mapset editor we use a text array instead,
        // it's only necessary when there is new lines in the text
        // Manage new lines
        // We replace empty white spaces used to keep normal spaces before and after the name.
        let names: string | string[] = feature.get(
          FeatureProperty.Name,
        ) as string;
        if (names.includes("\n")) {
          const array: string[] = [];
          const split = names.split("\n");
          split.forEach((txt, idx) => {
            array.push(txt || "\u200B", txt ? font : "");

            if (idx < split.length - 1) {
              array.push("\n", "");
            }
          });
          names = array;
        } else {
          names = [names, font];
        }

        text = new Text({
          fill: style.getText()!.getFill(),
          font: getTextFontFromString(font), // We manage bold in textArray
          // rotation unsupported by KML, taken instead from custom field.
          rotation: (feature.get(FeatureProperty.TextRotation) as number) ?? 0,
          // stroke: style.getText().getStroke(),
          scale: style.getText()?.getScale(),
          // since ol 6.3.1 : https://github.com/openlayers/openlayers/pull/10613/files#diff-1883da8b57e690db7ea0c35ce53c880aR925
          // a default textstroke is added to mimic google earth.
          // it was not the case before, the stroke was always null. So to keep
          // the same behavior we don't copy the stroke style.
          // TODO : maybe we should use this functionnality in the futur.
          text: names,
        });

        if (feature.get(FeatureProperty.TextArray)) {
          text.setText(feature.get(FeatureProperty.TextArray) as string[]);
        }

        if (
          feature.get(FeatureProperty.TextStrokeColor) &&
          feature.get(FeatureProperty.TextStrokeWidth)
        ) {
          text.setStroke(
            new Stroke({
              color: feature.get(FeatureProperty.TextStrokeColor) as Color,
              width: feature.get(FeatureProperty.TextStrokeWidth) as number,
            }),
          );
        }

        if (feature.get(FeatureProperty.TextAlign)) {
          text.setTextAlign(
            feature.get(FeatureProperty.TextAlign) as CanvasTextAlign,
          );
        }

        if (feature.get(FeatureProperty.TextOffsetX)) {
          text.setOffsetX(feature.get(FeatureProperty.TextOffsetX) as number);
        }

        if (feature.get(FeatureProperty.TextOffsetY)) {
          text.setOffsetY(feature.get(FeatureProperty.TextOffsetY) as number);
        }

        if (feature.get(FeatureProperty.TextBackgroundFillColor)) {
          text.setBackgroundFill(
            new Fill({
              color: feature.get(
                FeatureProperty.TextBackgroundFillColor,
              ) as Color,
            }),
          );
        }

        if (feature.get(FeatureProperty.TextPadding)) {
          text.setPadding(feature.get(FeatureProperty.TextPadding) as number[]);
        }

        if (image instanceof Icon) {
          applyTextStyleForIcon(image, text);
        }
      }

      if (image instanceof Icon) {
        /* Apply icon rotation if defined (by default only written as
         * <heading> tag, which is not read as rotation value by the ol KML module)
         */
        image.setRotation(
          (feature.get(FeatureProperty.IconRotation) as number) ?? 0,
        );
        if (feature.get(FeatureProperty.IconScale) !== undefined) {
          image.setScale(
            (feature.get(FeatureProperty.IconScale) as number) ?? 0,
          );

          // We fix the 32px scaling introduced by OL 6.7 only if the image has a size defined.
        } else if (!doNotRevert32pxScaling && image.getSize()) {
          const resizeScale = scaleForSize(image.getSize());
          image.setScale(image.getScaleArray()[0] / resizeScale);
        }
      }

      fill = null;
      stroke = null;

      styles = (feat, resolution) => {
        /* Options to be used for picture scaling with map, should have at least
         * a resolution attribute (this is the map resolution at the zoom level when
         * the picture is created), can take an optional constant for further scale
         * adjustment.
         * e.g. { resolution: 0.123, defaultScale: 1 / 6 }
         */
        if (feat.get(FeatureProperty.PictureOptions)) {
          const options = feat.get(
            FeatureProperty.PictureOptions,
          ) as PictureOptions;
          if (options?.resolution) {
            image?.setScale(
              (options.resolution / resolution) * (options?.defaultScale ?? 1),
            );
          }
        }

        return new Style({
          fill: fill ?? undefined,
          image: image ?? undefined,
          stroke: stroke ?? undefined,
          text: text ?? undefined,
          zIndex: feat.get(FeatureProperty.ZIndex) as number | undefined,
        });
      };
    }

    // Remove image and text styles for polygons and lines
    if (!(
      geom instanceof Point ||
      geom instanceof MultiPoint ||
      geom instanceof GeometryCollection
    )) {
      styles = [
        new Style({
          fill: style?.getFill() ?? undefined,
          image: undefined,
          stroke: stroke ?? undefined,
          text: undefined,
          zIndex: style?.getZIndex(),
        }),
      ];

      // Parse the fillPattern json string and store parsed object
      const fillPatternOptions = feature.get(FeatureProperty.FillPattern) as
        PolygonFillPatternInput | undefined;

      if (fillPatternOptions) {
        /* We set the fill pattern for polygons */
        if (!style?.getFill()) {
          styles[0].setFill(new Fill());
        }
        const patternOrColor = fillPatternOptions?.empty
          ? [0, 0, 0, 0]
          : getPolygonPattern(fillPatternOptions.id, fillPatternOptions.color);
        styles[0]?.getFill()?.setColor(patternOrColor as ColorLike);
      }

      // Add line's icons styles
      if (feature.get(FeatureProperty.LineStartIcon)) {
        styles.push(
          getLineIcon(
            feature,
            JSON.parse(
              feature.get(FeatureProperty.LineStartIcon) as string,
            ) as IconOptions,
            stroke?.getColor() as Color,
          ),
        );
      }

      if (feature.get(FeatureProperty.LineEndIcon)) {
        styles.push(
          getLineIcon(
            feature,
            JSON.parse(
              feature.get(FeatureProperty.LineEndIcon) as string,
            ) as IconOptions,
            stroke?.getColor() as Color,
            false,
          ),
        );
      }
    }

    // Apply minZoom and maxZoom properties if they are defined on the feature
    // and if the getResolutionForZoom function is provided in options
    let styleFunction: StyleFunction | undefined = undefined;
    if (
      applyMinMaxZoom &&
      getResolutionForZoom &&
      (feature.get(FeatureProperty.MinZoom) ||
        feature.get(FeatureProperty.MaxZoom))
    ) {
      styleFunction = (feat: FeatureLike, resolution: number) => {
        const minRes = getResolutionForZoom(
          (feature.get(FeatureProperty.MinZoom) as number) || -Infinity,
        );

        const maxRes = getResolutionForZoom(
          (feature.get(FeatureProperty.MaxZoom) as number) || Infinity,
        );

        // We test if the resolution exists because you could call the styleFuntion
        // with an  undefined resolution like in mapset to get the actula styles
        // without applying the min max zoom filter.
        if (
          !Number.isNaN(resolution) &&
          (resolution > minRes || maxRes > resolution)
        ) {
          return;
        }
        if (typeof styles === "function") {
          return styles(feat, resolution);
        }
        return styles;
      };
    }

    feature.setStyle(styleFunction ?? styles);
  }

  /**
   * Write the <Camera> tag into a KML string. Returns the KML string with added <Camera> tag.
   * @param {String} kmlString A string representing a KML file.
   * @param {Object} cameraAttributes Object containing the camera tags (longitude, latitude, altitude, heading, tilt, altitudeMode, roll)
   *    as keys with corresponding values. See https://developers.google.com/kml/documentation/kmlreference#camera
   */
  writeDocumentCamera = (
    kmlString: string,
    cameraAttributes?: null | Record<string, string>,
  ) => {
    const kmlDoc = parse(this.removeDocumentCamera(kmlString));

    if (cameraAttributes) {
      // Create Camera node with child attributes if the cameraAttributes object is defined
      const cameraNode = kmlDoc.createElement("Camera");
      Object.keys(cameraAttributes).forEach((key) => {
        const cameraAttribute = kmlDoc.createElement(
          `${key.charAt(0).toUpperCase() + key.slice(1)}`,
        );
        cameraAttribute.innerHTML = cameraAttributes[key];
        cameraNode.appendChild(cameraAttribute);
      });
      const documentNode = kmlDoc.getElementsByTagName("Document")[0];
      documentNode.appendChild(cameraNode);
    }

    return new XMLSerializer().serializeToString(kmlDoc);
  };

  /**
   * Create a KML string.
   * @param {VectorLayer} layer A openlayers VectorLayer.
   * @param {Object} formatOptions  used to writes features. It extends the ol KML format read options with some custom options.
   * @param {string[]} [formatOptions.allowedProperties=[]] List of allowed properties to be included in the KML ExtendedData.
   * @param {number} [formatOptions.resolution=1] The resolution of the map when exporting features.
   */
  public writeFeatures(
    layer: Vector<VectorSource<FeatureLike>>,
    formatOptions: MapsetKmlFormatWriteOptions = {},
  ) {
    let featString;
    const exportFeatures = [];
    const {
      allowedProperties = [],
      featureProjection = EPSG_4326,
      resolution = 1,
    } = formatOptions;

    [...(layer?.getSource()?.getFeatures() ?? [])]
      .sort((a, b) => {
        // The order of features must be kept.
        // We could use the useSpatialIndex = false property on the layer
        // but we prefer to sort feature by ol uid because ol uid is an integer
        // increased on each creation of a feature.
        // So we will keep the order of creation made by the the KML parser.
        // Ideally we should order by the zIndex of the style only.
        if (getUid(a) <= getUid(b)) {
          return -1;
        }
        return 1;
      })
      .forEach((feature) => {
        const clone = feature.clone() as FeatureType;
        const zIndex = asInteger(
          feature?.get(FeatureProperty.ZIndex) as string,
        );

        if (clone.getGeometry()?.getType() === "Circle") {
          // We transform circle elements into polygons
          // because circle not supported in KML spec and in ol KML parser
          const circleGeom = feature.getGeometry() as CircleGeom;
          clone.setGeometry(fromCircle(circleGeom, 100));
          clone.set(
            CIRCLE_GEOMETRY_CENTER,
            JSON.stringify(
              transform(circleGeom.getCenter(), featureProjection, EPSG_4326),
            ),
          );
          clone.set(CIRCLE_GEOMETRY_RADIUS, circleGeom.getRadius());
        }
        clone.setId(feature.getId());

        // We remove all ExtendedData not related to style or not allowed.
        Object.keys(feature.getProperties()).forEach((key) => {
          if (
            !NO_STYLE_PROPERTIES.includes(key) &&
            !allowedProperties.some((regex) => regex.test(key))
          ) {
            clone.unset(key, true);
          }
        });

        let styles;

        if (feature.getStyleFunction()) {
          styles = feature.getStyleFunction()?.(feature, resolution) as
            Style | Style[];
        } else if (layer?.getStyleFunction()) {
          styles = layer.getStyleFunction()?.(feature, resolution) as
            Style | Style[];
        }

        const mainStyle = Array.isArray(styles) ? styles[0] : styles;

        const newStyle = {
          fill: mainStyle?.getFill() ?? undefined,
          image: mainStyle?.getImage() ?? undefined,
          stroke: mainStyle?.getStroke() ?? undefined,
          text: mainStyle?.getText() ?? undefined,
          zIndex: zIndex,
        };

        const text = newStyle.text?.getText();

        if (text) {
          let kmlText = "";

          if (Array.isArray(text)) {
            // text can be a string or an array of strings
            clone.set(FeatureProperty.TextArray, JSON.stringify(text));
            const textArray = text;
            // in the KML we just add the text without the bold or italic information
            kmlText = textArray
              .map((t, idx) => {
                return idx % 2 === 0 ? t : "";
              })
              .join("")
              .replace(/\u200B/g, "");
          }

          // We add the current text as features's name so it will be added as Placemark's name in the kml
          if (kmlText) {
            // If we see spaces at the beginning or at the end we add a empty
            // white space at the beginning and at the end.
            if (/^(\s|\n)|(\n|\s)$/g.test(kmlText)) {
              clone.set(FeatureProperty.Name, `\u200B${kmlText}\u200B`);
            } else {
              clone.set(FeatureProperty.Name, kmlText);
            }
          }
        }

        // Set custom properties to be converted in extendedData in KML.
        if (zIndex !== undefined) {
          clone.set(FeatureProperty.ZIndex, zIndex);
        }
        if (newStyle.text?.getRotation()) {
          clone.set(FeatureProperty.TextRotation, newStyle.text.getRotation());
        }

        if (newStyle.text?.getFont()) {
          clone.set(FeatureProperty.TextFont, newStyle.text.getFont());
        }

        if (newStyle.text?.getTextAlign()) {
          clone.set(FeatureProperty.TextAlign, newStyle.text.getTextAlign());
        }

        if (newStyle.text?.getOffsetX()) {
          clone.set(FeatureProperty.TextOffsetX, newStyle.text.getOffsetX());
        }

        if (newStyle.text?.getOffsetY()) {
          clone.set(FeatureProperty.TextOffsetY, newStyle.text.getOffsetY());
        }

        if (newStyle.text?.getStroke()) {
          if (newStyle.text.getStroke()?.getColor()) {
            clone.set(
              FeatureProperty.TextStrokeColor,
              asString(newStyle.text.getStroke()?.getColor() as Color),
            );
          }

          if (newStyle.text.getStroke()?.getWidth()) {
            clone.set(
              FeatureProperty.TextStrokeWidth,
              newStyle.text.getStroke()?.getWidth(),
            );
          }
        }

        if (newStyle.text?.getBackgroundFill()) {
          clone.set(
            FeatureProperty.TextBackgroundFillColor,
            asString(newStyle.text.getBackgroundFill()?.getColor() as Color),
          );
        }

        if (newStyle.text?.getPadding()) {
          clone.set(
            FeatureProperty.TextPadding,
            newStyle.text.getPadding()?.join(),
          );
        }

        if (newStyle.stroke?.getLineCap()) {
          clone.set(FeatureProperty.LineCap, newStyle.stroke.getLineCap());
        }

        if (newStyle.stroke?.getLineJoin()) {
          clone.set(FeatureProperty.LineJoin, newStyle.stroke.getLineJoin());
        }

        if (newStyle.stroke?.getLineDash()) {
          clone.set(
            FeatureProperty.LineDash,
            newStyle.stroke.getLineDash()?.join(","),
          );
        }

        if (newStyle.stroke?.getLineDashOffset()) {
          clone.set(
            FeatureProperty.LineDashOffset,
            newStyle.stroke.getLineDashOffset(),
          );
        }

        if (newStyle.stroke?.getMiterLimit()) {
          clone.set(
            FeatureProperty.MiterLimit,
            newStyle.stroke.getMiterLimit(),
          );
        }

        if (newStyle.image instanceof Circle) {
          newStyle.image = undefined;
        }

        if (newStyle.image) {
          const imgSource = (newStyle.image as Icon).getSrc();
          if (!/(http(s?)):\/\//gi.test(imgSource!)) {
            // eslint-disable-next-line no-console
            console.log(
              "Local image source not supported for KML export." +
                "Should use remote web server",
            );
          }

          if (newStyle.image.getRotation()) {
            // We set the icon rotation as extended data
            clone.set(
              FeatureProperty.IconRotation,
              newStyle.image.getRotation(),
            );
          }

          if (newStyle.image.getScale()) {
            // We set the scale as extended metadata because the <scale> in the KML is related to a 32px img, since ol >= 6.10.
            clone.set(FeatureProperty.IconScale, newStyle.image.getScale());
          }

          // Set map resolution to use for icon-to-map proportional scaling
          if (feature.get(FeatureProperty.PictureOptions)) {
            clone.set(
              FeatureProperty.PictureOptions,
              JSON.stringify(feature.get(FeatureProperty.PictureOptions)),
            );
          }
        }

        // In case a fill pattern should be applied (use fillPattern attribute to store pattern id, color etc)
        if (feature.get(FeatureProperty.FillPattern)) {
          clone.set(
            FeatureProperty.FillPattern,
            JSON.stringify(feature.get(FeatureProperty.FillPattern)),
          );
          newStyle.fill = undefined;
        }

        // maxZoom: maximum zoom level at which the feature is displayed
        const maxZoom = parseFloat(
          feature.get(FeatureProperty.MaxZoom) as string,
        );
        if (!Number.isNaN(maxZoom)) {
          clone.set(FeatureProperty.MaxZoom, maxZoom);
        }

        // minZoom: minimum zoom level at which the feature is displayed
        const minZoom = parseFloat(
          feature.get(FeatureProperty.MinZoom) as string,
        );
        if (!Number.isNaN(minZoom)) {
          clone.set(FeatureProperty.MinZoom, minZoom);
        }

        // If only text is displayed we must specify an
        // image style with scale=0
        if (newStyle.text && !newStyle.image) {
          newStyle.image = new Icon({
            scale: 0,
            src: "noimage",
          });
        }

        // In case we use line's icon .
        const extraLineStyles =
          (Array.isArray(styles) && styles.slice(1)) || [];
        extraLineStyles.forEach((extraLineStyle) => {
          if (
            extraLineStyle &&
            extraLineStyle.getImage() instanceof Icon &&
            extraLineStyle.getGeometry()
          ) {
            const coord = (
              (extraLineStyle?.getGeometry() as GeometryFunction)?.(
                feature,
              ) as SimpleGeometry
            )?.getCoordinates();

            const startCoord = (
              feature.getGeometry() as SimpleGeometry
            )?.getFirstCoordinate();

            if (
              coord?.[0] === startCoord?.[0] &&
              coord?.[1] === startCoord?.[1]
            ) {
              clone.set(
                FeatureProperty.LineStartIcon,
                JSON.stringify({
                  scale: extraLineStyle?.getImage()?.getScale(),
                  size: extraLineStyle?.getImage()?.getSize(),
                  url: (extraLineStyle?.getImage() as Icon)?.getSrc(),
                  zIndex: extraLineStyle?.getZIndex(),
                }),
              );
            } else {
              clone.set(
                FeatureProperty.LineEndIcon,
                JSON.stringify({
                  scale: extraLineStyle.getImage()?.getScale(),
                  size: extraLineStyle.getImage()?.getSize(),
                  url: (extraLineStyle.getImage() as Icon)?.getSrc(),
                  zIndex: extraLineStyle.getZIndex(),
                }),
              );
            }
          }
        });

        const olStyle = new Style(newStyle);
        clone.setStyle(olStyle);

        if (!(
          clone.getGeometry() instanceof Point &&
          olStyle.getText() &&
          !olStyle.getText()?.getText()
        )) {
          exportFeatures.push(clone);
        }
      });

    if (exportFeatures.length > 0) {
      if (exportFeatures.length === 1) {
        // force the add of a <Document> node
        exportFeatures.push(new Feature());
      }

      featString = new KML({
        defaultStyle: [kmlStyle],
        extractStyles: true,
      }).writeFeatures(exportFeatures, formatOptions);

      // Remove no image hack
      featString = featString.replace(
        /<Icon>\s*<href>noimage<\/href>\s*<\/Icon>/g,
        "",
      );

      // Remove empty placemark added to have
      // <Document> tag
      featString = featString.replace(/<Placemark\/>/g, "");

      // Add KML document name
      if (layer.get(FeatureProperty.Name)) {
        featString = featString.replace(
          /<Document>/,
          `<Document><name>${layer.get(FeatureProperty.Name)}</name>`,
        );
      }
    }

    return featString;
  }
}

export default MapsetKmlFormat;
