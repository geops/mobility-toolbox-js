/* eslint-disable no-underscore-dangle */
import { FrameState } from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON';
import { Coordinate } from 'ol/coordinate';
import { FeatureCallback } from 'ol/renderer/vector';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { Pixel } from 'ol/pixel';
import { composeCssTransform } from 'ol/transform';
import { buffer, containsCoordinate } from 'ol/extent';
import CanvasLayerRenderer from 'ol/renderer/canvas/Layer';
import { RealtimeTrajectory } from '../../api/typedefs';
import type RealtimeLayer from '../layers/RealtimeLayer';

/** @private */
const format = new GeoJSON();

/**
 * This class is a renderer for Maplibre Layer to be able to use the native ol
 * functionnalities like map.getFeaturesAtPixel or map.hasFeatureAtPixel.
 * @private
 */
// @ts-ignore
export default class RealtimeLayerRenderer extends CanvasLayerRenderer<RealtimeLayer> {
  // private container: HTMLElement | undefined;

  private canvas: HTMLCanvasElement | undefined;

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
        context?.clearRect(
          0,
          0,
          canvas?.width as number,
          canvas?.height as number,
        );
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

  getFeaturesAtCoordinate(
    coordinate: Coordinate | undefined,
    hitTolerance: number = 5,
  ): Feature<Geometry>[] {
    if (!coordinate) {
      return [];
    }

    const layer = this.getLayer();
    const map = layer.getMapInternal();
    const resolution = map?.getView()?.getResolution() || 1;
    const nb = 10;
    const ext = buffer(
      [...coordinate, ...coordinate],
      hitTolerance * resolution,
    );
    let features: Feature[] = [];

    let trajectories = Object.values(layer.trajectories || {});
    if (layer.sort) {
      // @ts-ignore
      trajectories = trajectories.sort(this.sort);
    }

    const vehicles = [];
    for (let i = 0; i < trajectories.length; i += 1) {
      const trajectory = trajectories[i] as RealtimeTrajectory;
      if (
        trajectory.properties.coordinate &&
        containsCoordinate(ext, trajectory.properties.coordinate)
      ) {
        vehicles.push(trajectories[i]);
      }
      if (vehicles.length === nb) {
        break;
      }
    }

    features = vehicles.map(
      (vehicle) => format.readFeature(vehicle) as Feature,
    );
    return features;
  }
}
