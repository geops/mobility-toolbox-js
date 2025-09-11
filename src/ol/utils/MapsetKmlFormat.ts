import { replace } from 'lodash';
import { Feature, getUid } from 'ol';
import { asString } from 'ol/color';
import KML from 'ol/format/KML';
import CircleGeom from 'ol/geom/Circle';
import GeometryCollection from 'ol/geom/GeometryCollection';
import MultiPoint from 'ol/geom/MultiPoint';
import Point from 'ol/geom/Point';
import { fromCircle } from 'ol/geom/Polygon';
import { get, transform } from 'ol/proj';
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import { parse } from 'ol/xml';

import getPolygonPattern from './getMapsetPolygonPattern';

import type { Feature as FeatureType } from 'ol';
import type { Color } from 'ol/color';
import type { ColorLike } from 'ol/colorlike';
import type { Coordinate } from 'ol/coordinate';
import type { FeatureLike } from 'ol/Feature';
import type { SimpleGeometry } from 'ol/geom';
import type { Vector } from 'ol/layer';
import type { ProjectionLike } from 'ol/proj';
import type { Size } from 'ol/size';
import type VectorSource from 'ol/source/Vector';
import type {
  GeometryFunction,
  StyleFunction,
  StyleLike,
} from 'ol/style/Style';

import type { PolygonFillPatternInput } from './getMapsetPolygonPattern';

const CIRCLE_GEOMETRY_CENTER = 'circleGeometryCenter';
const CIRCLE_GEOMETRY_RADIUS = 'circleGeometryRadius';
const EPSG_4326 = get('EPSG:4326') as ProjectionLike;

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
    font: 'normal 16px Helvetica',
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
  olText.setTextAlign('left');
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
    zIndex: icon.zIndex,
  });
};

class MapsetKmlFormat {
  /**
   * Read a KML string.
   * @param {String} kmlString A string representing a KML file.
   * @param {<ol.Projection|String>} featureProjection The projection used by the map.
   * @param {<boolean>} doNotRevert32pxScaling Set it to true if you use ol < 6.7 and last version of react-spatial, Fix the 32px scaling, introduced by (ol >= 6.7), see https://github.com/openlayers/openlayers/pull/12695.
   */
  public readFeatures(
    kmlString: string,
    featureProjection: ProjectionLike,
    doNotRevert32pxScaling = false,
  ): FeatureType[] {
    // Since ol 6.7, the KML follows better the spec and GoogleEarth interpretation, see https://github.com/openlayers/openlayers/pull/12695.
    // so the <scale> value is interpreted using an image size of 32px.
    // So when revert32pxScaling is true we fix back the scale, to use only, if you use an OL < 6.7.
    // Now the writeFeatures function use the iconScale extended data to set the image's scale.
    // If the extended data is not found it will look at this boolean to define if we must revert the scale or not.
    const features = new KML().readFeatures(kmlString, {
      featureProjection,
    });
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
            featureProjection || EPSG_4326,
          ),
          parseFloat(circleGeometryRadius as string),
        );

        circle.setProperties(feature?.getGeometry()?.getProperties() ?? {});
        feature.setGeometry(circle);
      }

      this.sanitizeFeature(feature, doNotRevert32pxScaling);
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
    const oldCameraNode = kmlDoc.getElementsByTagName('Camera')[0];
    if (oldCameraNode) {
      oldCameraNode.remove();
    }
    return new XMLSerializer().serializeToString(kmlDoc);
  }

  public sanitizeFeature(feature: FeatureType, doNotRevert32pxScaling = false) {
    const geom = feature.getGeometry();
    let styles: StyleFunction | StyleLike[] | undefined =
      feature.getStyleFunction();

    // Store maxZoom in properties
    if (feature.get('maxZoom')) {
      feature.set('maxZoom', parseFloat(feature.get('maxZoom') as string));
    }

    // Store minZoom in properties
    if (feature.get('minZoom')) {
      feature.set('minZoom', parseFloat(feature.get('minZoom') as string));
    }

    // The use of clone is part of the scale fix for OL > 6.7
    // If an IconStyle has no gx:w and gx:h defined, a scale factor is applied
    // after the image is loaded. To avoided having the scale factor applied we
    // clone the style and keep the scale as it is.
    // Having gx:w and gx:h not defined should not happen, using the last version of the parser/reader.
    const tmpStyles = styles?.(feature, 1);
    const style = (
      Array.isArray(tmpStyles) ? tmpStyles[0] : tmpStyles
    )?.clone();

    let stroke = style?.getStroke();

    if (feature.get('lineCap')) {
      stroke?.setLineCap(feature.get('lineCap') as CanvasLineCap);
    }

    if (feature.get('lineJoin')) {
      stroke?.setLineJoin(feature.get('lineJoin') as CanvasLineJoin);
    }

    if (feature.get('lineDash')) {
      stroke?.setLineDash(
        (feature?.get('lineDash') as string).split(',').map((l) => {
          return parseInt(l, 10);
        }),
      );
    }

    if (feature.get('lineDashOffset')) {
      stroke?.setLineDashOffset(
        parseInt(feature.get('lineDashOffset') as string, 10),
      );
    }

    if (feature.get('miterLimit')) {
      stroke?.setMiterLimit(parseInt(feature.get('miterLimit') as string, 10));
    }

    // The canvas draws a stroke width=1 by default if width=0, so we
    // remove the stroke style in that case.
    if (stroke && stroke.getWidth() === 0) {
      stroke = undefined;
    }

    if (feature.get('zIndex')) {
      style?.setZIndex(parseInt(feature.get('zIndex') as string, 10));
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
        feature.get('name') &&
        style.getText() &&
        style.getText()?.getScale() !== 0
      ) {
        if (image && image.getScale() === 0) {
          // transparentCircle is used to allow selection
          image = new Circle({
            fill: new Fill({ color: [0, 0, 0, 0] }),
            radius: 1,
            stroke: new Stroke({ color: [0, 0, 0, 0] }),
          });
        }

        // We replace empty white spaces used to keep normal spaces before and after the name.
        let name: string | string[] = feature.get('name') as string;
        if (/\u200B/g.test(name)) {
          name = name.replace(/\u200B/g, '');
          feature.set('name', name);
        }

        // For backward compatibility we translate the bold and italic textFont property to a textArray prop
        const font = (feature.get('textFont') as string) || 'normal 16px Arial';

        // Since we use rich text in mapset editor we use a text array instead,
        // it's only necessary when there is new lines in the text
        // Manage new lines
        if (name.includes('\n')) {
          const array: string[] = [];
          const split = name.split('\n');
          split.forEach((txt, idx) => {
            array.push(txt || '\u200B', txt ? font : '');

            if (idx < split.length - 1) {
              array.push('\n', '');
            }
          });
          name = array;
        } else {
          name = [name, font];
        }

        text = new Text({
          fill: style.getText()!.getFill(),
          font: `${font.replace(/bold/g, 'normal')}, Arial, sans-serif`, // We manage bold in textArray
          // rotation unsupported by KML, taken instead from custom field.
          rotation: (feature.get('textRotation') as number) || 0,
          // stroke: style.getText().getStroke(),
          scale: style.getText()?.getScale(),
          // since ol 6.3.1 : https://github.com/openlayers/openlayers/pull/10613/files#diff-1883da8b57e690db7ea0c35ce53c880aR925
          // a default textstroke is added to mimic google earth.
          // it was not the case before, the stroke was always null. So to keep
          // the same behavior we don't copy the stroke style.
          // TODO : maybe we should use this functionnality in the futur.
          text: name,
        });

        if (feature.get('textArray')) {
          try {
            const textArray = JSON.parse(
              replace(feature.get('textArray') as string, /\r?\n/g, '\\n'),
            ) as string[];
            text.setText(textArray);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(
              'Error parsing textArray',
              feature.get('textArray'),
              err,
            );
          }
        }

        if (feature.get('textStrokeColor') && feature.get('textStrokeWidth')) {
          text.setStroke(
            new Stroke({
              color: feature.get('textStrokeColor') as Color,
              width: parseFloat(feature.get('textStrokeWidth') as string),
            }),
          );
        }

        if (feature.get('textAlign')) {
          text.setTextAlign(feature.get('textAlign') as CanvasTextAlign);
        }

        if (feature.get('textOffsetX')) {
          text.setOffsetX(parseFloat(feature.get('textOffsetX') as string));
        }

        if (feature.get('textOffsetY')) {
          text.setOffsetY(parseFloat(feature.get('textOffsetY') as string));
        }

        if (feature.get('textBackgroundFillColor')) {
          text.setBackgroundFill(
            new Fill({
              color: feature.get('textBackgroundFillColor') as Color,
            }),
          );
        }

        if (feature.get('textPadding')) {
          text.setPadding(
            (feature.get('textPadding') as string)
              ?.split(',')
              .map((n: string) => {
                return parseFloat(n);
              }) as [number, number, number, number],
          );
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
          parseFloat(feature.get('iconRotation') as string) || 0,
        );

        if (feature.get('iconScale')) {
          image.setScale(parseFloat(feature.get('iconScale') as string) || 0);

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

        interface PictureOptions {
          defaultScale?: number;
          resolution: number;
        }

        if (feat.get('pictureOptions')) {
          let pictureOptions = feat.get('pictureOptions') as
            | PictureOptions
            | string;
          if (typeof pictureOptions === 'string') {
            pictureOptions = JSON.parse(pictureOptions) as PictureOptions;
          }
          (feat as FeatureType).set('pictureOptions', pictureOptions);
          if (pictureOptions.resolution) {
            image?.setScale(
              (pictureOptions.resolution / resolution) *
                (pictureOptions?.defaultScale ?? 1),
            );
          }
        }

        return new Style({
          fill: fill ?? undefined,
          image: image ?? undefined,
          stroke: stroke ?? undefined,
          text: text ?? undefined,
          zIndex: style.getZIndex(),
        });
      };
    }

    // Remove image and text styles for polygons and lines
    if (
      !(
        geom instanceof Point ||
        geom instanceof MultiPoint ||
        geom instanceof GeometryCollection
      )
    ) {
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
      const fillPattern = feature.get('fillPattern') as string;
      if (fillPattern) {
        const fillPatternOptions = JSON.parse(
          fillPattern,
        ) as PolygonFillPatternInput;
        feature.set('fillPattern', fillPatternOptions);

        /* We set the fill pattern for polygons */
        if (!style?.getFill()) {
          (styles[0] as Style).setFill(new Fill());
        }
        const patternOrColor = fillPatternOptions?.empty
          ? [0, 0, 0, 0]
          : getPolygonPattern(fillPatternOptions.id, fillPatternOptions.color);
        (styles[0] as Style)?.getFill()?.setColor(patternOrColor as ColorLike);
      }

      // Add line's icons styles
      if (feature.get('lineStartIcon')) {
        styles.push(
          getLineIcon(
            feature,
            JSON.parse(feature.get('lineStartIcon') as string) as IconOptions,
            stroke?.getColor() as Color,
          ),
        );
      }

      if (feature.get('lineEndIcon')) {
        styles.push(
          getLineIcon(
            feature,
            JSON.parse(feature.get('lineEndIcon') as string) as IconOptions,
            stroke?.getColor() as Color,
            false,
          ),
        );
      }
    }
    feature.setStyle(styles as StyleLike);
  }

  /**
   * Write the <Camera> tag into a KML string. Returns the KML string with added <Camera> tag.
   * @param {String} kmlString A string representing a KML file.
   * @param {Object} cameraAttributes Object containing the camera tags (longitude, latitude, altitude, heading, tilt, altitudeMode, roll)
   *    as keys with corresponding values. See https://developers.google.com/kml/documentation/kmlreference#camera
   */
  writeDocumentCamera = (
    kmlString: string,
    cameraAttributes: null | Record<string, string>,
  ) => {
    const kmlDoc = parse(this.removeDocumentCamera(kmlString));

    if (cameraAttributes) {
      // Create Camera node with child attributes if the cameraAttributes object is defined
      const cameraNode = kmlDoc.createElement('Camera');
      Object.keys(cameraAttributes).forEach((key) => {
        const cameraAttribute = kmlDoc.createElement(
          `${key.charAt(0).toUpperCase() + key.slice(1)}`,
        );
        cameraAttribute.innerHTML = cameraAttributes[key];
        cameraNode.appendChild(cameraAttribute);
      });
      const documentNode = kmlDoc.getElementsByTagName('Document')[0];
      documentNode.appendChild(cameraNode);
    }

    return new XMLSerializer().serializeToString(kmlDoc);
  };

  /**
   * Create a KML string.
   * @param {VectorLayer} layer A react-spatial VectorLayer.
   * @param {<ol.Projection|String>} featureProjection The current projection used by the features.
   * @param {<boolean>} fixGxyAndGxh If the KML contains gx:w and gx:h, (ol >= 6.7), it will fix the bug introduced by https://github.com/openlayers/openlayers/pull/12695.
   */
  public writeFeatures(
    layer: Vector<VectorSource<FeatureLike>>,
    featureProjection: string,
    mapResolution: number,
  ) {
    let featString;
    // const olLayer = layer.olLayer || layer.get('olLayer') || layer;
    const exportFeatures = [];

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
        if (clone.getGeometry()?.getType() === 'Circle') {
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
        clone.getGeometry()?.transform(featureProjection, EPSG_4326);

        // We remove all ExtendedData not related to style.
        Object.keys(feature.getProperties()).forEach((key) => {
          if (
            ![
              CIRCLE_GEOMETRY_CENTER,
              CIRCLE_GEOMETRY_RADIUS,
              'description',
              'geometry',
              'name',
            ].includes(key)
          ) {
            clone.unset(key, true);
          }
        });

        let styles;

        if (feature.getStyleFunction()) {
          styles = feature.getStyleFunction()?.(feature, mapResolution) as
            | Style
            | Style[];
        } else if (layer?.getStyleFunction()) {
          styles = layer.getStyleFunction()?.(feature, mapResolution) as
            | Style
            | Style[];
        }

        const mainStyle = Array.isArray(styles) ? styles[0] : styles;

        const newStyle = {
          fill: mainStyle?.getFill() ?? undefined,
          image: mainStyle?.getImage() ?? undefined,
          stroke: mainStyle?.getStroke() ?? undefined,
          text: mainStyle?.getText() ?? undefined,
          zIndex: mainStyle?.getZIndex() ?? undefined,
        };

        if (newStyle.zIndex) {
          clone.set('zIndex', newStyle.zIndex);
        }

        const text = newStyle.text?.getText();

        if (text) {
          let kmlText = '';

          if (Array.isArray(text)) {
            // text can be a string or an array of strings
            clone.set('textArray', JSON.stringify(text));
            const textArray = text;
            // in the KML we just add the text without the bold or italic information
            kmlText = textArray
              .map((t, idx) => {
                return idx % 2 === 0 ? t : '';
              })
              .join('')
              .replace(/\u200B/g, '');
          }

          // We add the current text as features's name so it will be added as Placemark's name in the kml
          if (kmlText) {
            // If we see spaces at the beginning or at the end we add a empty
            // white space at the beginning and at the end.
            if (/^(\s|\n)|(\n|\s)$/g.test(kmlText)) {
              clone.set('name', `\u200B${kmlText}\u200B`);
            } else {
              clone.set('name', kmlText);
            }
          }
        }

        // Set custom properties to be converted in extendedData in KML.
        if (newStyle.text?.getRotation()) {
          clone.set('textRotation', newStyle.text.getRotation());
        }

        if (newStyle.text?.getFont()) {
          clone.set('textFont', newStyle.text.getFont());
        }

        if (newStyle.text?.getTextAlign()) {
          clone.set('textAlign', newStyle.text.getTextAlign());
        }

        if (newStyle.text?.getOffsetX()) {
          clone.set('textOffsetX', newStyle.text.getOffsetX());
        }

        if (newStyle.text?.getOffsetY()) {
          clone.set('textOffsetY', newStyle.text.getOffsetY());
        }

        if (newStyle.text?.getStroke()) {
          if (newStyle.text.getStroke()?.getColor()) {
            clone.set(
              'textStrokeColor',
              asString(newStyle.text.getStroke()?.getColor() as Color),
            );
          }

          if (newStyle.text.getStroke()?.getWidth()) {
            clone.set('textStrokeWidth', newStyle.text.getStroke()?.getWidth());
          }
        }

        if (newStyle.text?.getBackgroundFill()) {
          clone.set(
            'textBackgroundFillColor',
            asString(newStyle.text.getBackgroundFill()?.getColor() as Color),
          );
        }

        if (newStyle.text?.getPadding()) {
          clone.set('textPadding', newStyle.text.getPadding()?.join());
        }

        if (newStyle.stroke?.getLineCap()) {
          clone.set('lineCap', newStyle.stroke.getLineCap());
        }

        if (newStyle.stroke?.getLineJoin()) {
          clone.set('lineJoin', newStyle.stroke.getLineJoin());
        }

        if (newStyle.stroke?.getLineDash()) {
          clone.set('lineDash', newStyle.stroke.getLineDash()?.join(','));
        }

        if (newStyle.stroke?.getLineDashOffset()) {
          clone.set('lineDashOffset', newStyle.stroke.getLineDashOffset());
        }

        if (newStyle.stroke?.getMiterLimit()) {
          clone.set('miterLimit', newStyle.stroke.getMiterLimit());
        }

        if (newStyle.image instanceof Circle) {
          newStyle.image = undefined;
        }

        if (newStyle.image) {
          const imgSource = (newStyle.image as Icon).getSrc();
          if (!/(http(s?)):\/\//gi.test(imgSource!)) {
            // eslint-disable-next-line no-console
            console.log(
              'Local image source not supported for KML export.' +
                'Should use remote web server',
            );
          }

          if (newStyle.image.getRotation()) {
            // We set the icon rotation as extended data
            clone.set('iconRotation', newStyle.image.getRotation());
          }

          if (newStyle.image.getScale()) {
            // We set the scale as extended metadata because the <scale> in the KML is related to a 32px img, since ol >= 6.10.
            clone.set('iconScale', newStyle.image.getScale());
          }

          // Set map resolution to use for icon-to-map proportional scaling
          if (feature.get('pictureOptions')) {
            clone.set(
              'pictureOptions',
              JSON.stringify(feature.get('pictureOptions')),
            );
          }
        }

        // In case a fill pattern should be applied (use fillPattern attribute to store pattern id, color etc)
        if (feature.get('fillPattern')) {
          clone.set('fillPattern', JSON.stringify(feature.get('fillPattern')));
          newStyle.fill = undefined;
        }

        // maxZoom: maximum zoom level at which the feature is displayed
        if (feature.get('maxZoom')) {
          clone.set('maxZoom', parseFloat(feature.get('maxZoom') as string));
        }

        // minZoom: minimum zoom level at which the feature is displayed
        if (feature.get('minZoom')) {
          clone.set('minZoom', parseFloat(feature.get('minZoom') as string));
        }

        // If only text is displayed we must specify an
        // image style with scale=0
        if (newStyle.text && !newStyle.image) {
          newStyle.image = new Icon({
            scale: 0,
            src: 'noimage',
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
                'lineStartIcon',
                JSON.stringify({
                  scale: extraLineStyle?.getImage()?.getScale(),
                  size: extraLineStyle?.getImage()?.getSize(),
                  url: (extraLineStyle?.getImage() as Icon)?.getSrc(),
                  zIndex: extraLineStyle?.getZIndex(),
                }),
              );
            } else {
              clone.set(
                'lineEndIcon',
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

        if (
          !(
            clone.getGeometry() instanceof Point &&
            olStyle.getText() &&
            !olStyle.getText()?.getText()
          )
        ) {
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
      }).writeFeatures(exportFeatures);

      // Remove no image hack
      featString = featString.replace(
        /<Icon>\s*<href>noimage<\/href>\s*<\/Icon>/g,
        '',
      );

      // Remove empty placemark added to have
      // <Document> tag
      featString = featString.replace(/<Placemark\/>/g, '');

      // Add KML document name
      if (layer.get('name')) {
        featString = featString.replace(
          /<Document>/,
          `<Document><name>${layer.get('name')}</name>`,
        );
      }
    }

    return featString;
  }
}

export default MapsetKmlFormat;
