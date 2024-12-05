/* eslint-disable no-underscore-dangle */
import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';
import GeoJSON from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import { FrameState } from 'ol/Map';
import { Pixel } from 'ol/pixel';
import CanvasLayerRenderer from 'ol/renderer/canvas/Layer';
import { FeatureCallback } from 'ol/renderer/vector';
import { composeCssTransform } from 'ol/transform';

import type RealtimeLayer from '../layers/RealtimeLayer';

const format = new GeoJSON();

/**
 * This class is a renderer for Maplibre Layer to be able to use the native ol
 * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
 * @private
 */
export default class RealtimeLayerRenderer extends CanvasLayerRenderer<RealtimeLayer> {
  // private container: HTMLElement | undefined;

  private canvas: HTMLCanvasElement | undefined;

  override forEachFeatureAtCoordinate<Feature>(
    coordinate: Coordinate,
    frameState: FrameState,
    hitTolerance: number,
    callback: FeatureCallback<Feature>,
  ): Feature | undefined {
    const features = this.getFeaturesAtCoordinate(coordinate, hitTolerance);
    features.forEach((feature) => {
      // @ts-expect-error defintion to fix
      callback(feature, this.layer_, feature.getGeometry());
    });
    return features?.[0] as Feature;
  }

  override getData(pixel: Pixel) {
    let data;
    try {
      const { pixelRatio } = this.getLayer();
      const context = this.canvas?.getContext('2d', {
        willReadFrequently: true,
      });
      data =
        context?.getImageData(
          pixel[0] * (pixelRatio || 1),
          pixel[1] * (pixelRatio || 1),
          1,
          1,
        ).data || null; // [3];
      return data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('error getting data', err);
    }
    return null;
  }

  override getFeatures(pixel: Pixel) {
    const coordinate = this.getLayer()
      ?.getMapInternal()
      ?.getCoordinateFromPixel(pixel);
    return Promise.resolve(this.getFeaturesAtCoordinate(coordinate));
  }

  getFeaturesAtCoordinate(
    coordinate: Coordinate | undefined,
    hitTolerance = 5,
  ): Feature<Geometry>[] {
    if (!coordinate) {
      return [];
    }
    const layer = this.getLayer();
    const featureCollection = layer.engine.getVehiclesAtCoordinate(coordinate, {
      hitTolerance,
      nb: layer.maxNbFeaturesRequested,
    });
    return format.readFeatures(featureCollection);
  }

  // eslint-disable-next-line class-methods-use-this
  prepareFrame() {
    return true;
  }

  renderFrame(frameState: FrameState) {
    const { canvas, renderedViewState } = this.getLayer();
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = this.getLayer().getClassName();
      this.container.style.position = 'absolute';
      this.container.style.width = '100%';
      this.container.style.height = '100%';
      if (canvas instanceof HTMLCanvasElement) {
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.transformOrigin = 'top left';
        this.container.appendChild(canvas);
      }
    }

    if (renderedViewState) {
      const { center, resolution, rotation } = frameState.viewState;
      const {
        center: renderedCenter,
        resolution: renderedResolution,
        rotation: renderedRotation,
      } = renderedViewState;

      if (renderedResolution / resolution >= 3) {
        // Avoid having really big points when zooming fast.
        const context = canvas?.getContext('2d');
        if (canvas?.width && canvas?.height) {
          (context as CanvasRenderingContext2D)?.clearRect(
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }
      } else {
        const map = this.getLayer().getMapInternal();
        const pixelCenterRendered = map?.getPixelFromCoordinate(renderedCenter);
        const pixelCenter = map?.getPixelFromCoordinate(center);

        if (pixelCenterRendered && pixelCenter) {
          this.container.style.transform = composeCssTransform(
            pixelCenterRendered[0] - pixelCenter[0],
            pixelCenterRendered[1] - pixelCenter[1],
            renderedResolution / resolution,
            renderedResolution / resolution,
            rotation - renderedRotation,
            0,
            0,
          );
        }
      }
    }
    return this.container;
  }
}
