/* eslint-disable no-underscore-dangle */
import { FrameState } from 'ol/Map';
import { toDegrees } from 'ol/math';
import { toLonLat } from 'ol/proj';
import LayerRenderer from 'ol/renderer/Layer';
import GeoJSON from 'ol/format/GeoJSON';
import { Coordinate } from 'ol/coordinate';
import { FeatureCallback } from 'ol/renderer/vector';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { Pixel } from 'ol/pixel';
import { Map } from 'maplibre-gl';
import { MaplibreStyleLayer } from '../layers';

/**
 * @private
 */
const formats: {
  [key: string]: GeoJSON;
} = {
  'EPSG:3857': new GeoJSON({
    featureProjection: 'EPSG:3857',
  }),
};

/**
 * This class is a renderer for Maplibre Layer to be able to use the native ol
 * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
 * @private
 */
// @ts-ignore
export default class MaplibreStyleLayerRenderer extends LayerRenderer<MaplibreStyleLayer> {
  getFeaturesAtCoordinate(
    coordinate: Coordinate | undefined,
    hitTolerance: number = 5,
  ): Feature<Geometry>[] {
    if (!coordinate) {
      return [];
    }

    const layer = this.getLayer();
    const map = layer.getMapInternal();
    const { maplibreMap } = layer.maplibreLayer;

    const projection =
      map?.getView()?.getProjection()?.getCode() || 'EPSG:3857';
    let features: Feature[] = [];

    if (!formats[projection]) {
      formats[projection] = new GeoJSON({
        featureProjection: projection,
      });
    }

    if (maplibreMap?.isStyleLoaded()) {
      const pixel =
        coordinate &&
        maplibreMap.project(toLonLat(coordinate) as [number, number]);

      if (pixel?.x && pixel?.y) {
        let pixels: [[number, number], [number, number]] | [number, number] = [
          pixel.x,
          pixel.y,
        ];

        if (hitTolerance) {
          const [x, y] = pixels as [number, number];
          pixels = [
            [x - hitTolerance, y - hitTolerance],
            [x + hitTolerance, y + hitTolerance],
          ];
        }

        // We query features only on style layers used by this layer.
        let layers = layer.layers || [];

        if (layer.layersFilter) {
          layers = maplibreMap.getStyle().layers.filter(layer.layersFilter);
        }

        if (layer.queryRenderedLayersFilter) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          layers = maplibreMap
            .getStyle()
            .layers.filter(layer.queryRenderedLayersFilter);
        }

        // At this point we get GeoJSON Maplibre feature, we transform it to an OpenLayers
        // feature to be consistent with other layers.
        features = (maplibreMap as maplibregl.Map)
          .queryRenderedFeatures(pixels, {
            layers: layers.map((l) => l.id),
            validate: false,
            // ...layer.queryRenderedFeaturesOptions,
          })
          .map((feature) => {
            const olFeature = formats[projection].readFeature(
              feature,
            ) as Feature;
            if (olFeature) {
              // We save the original Maplibre feature to avoid losing informations
              // potentially needed for other functionnality like highlighting
              // (id, layer id, source, sourceLayer ...)
              // @ts-ignore
              olFeature.set('mapboxFeature', feature);
            }
            return olFeature;
          });
      }
    }
    return features;
  }

  // eslint-disable-next-line class-methods-use-this
  override prepareFrame() {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  renderFrame() {
    return null;
  }

  override getFeatures(pixel: Pixel) {
    const coordinate = this.getLayer()
      ?.getMapInternal()
      ?.getCoordinateFromPixel(pixel);
    return Promise.resolve(this.getFeaturesAtCoordinate(coordinate));
  }

  override forEachFeatureAtCoordinate<Feature>(
    coordinate: Coordinate,
    frameState: FrameState,
    hitTolerance: number,
    callback: FeatureCallback<Feature>,
  ): Feature | undefined {
    const features = this.getFeaturesAtCoordinate(coordinate, hitTolerance);
    features.forEach((feature) => {
      // @ts-ignore
      callback(feature, this.layer_, feature.getGeometry());
    });
    return features?.[0] as Feature;
  }
}
