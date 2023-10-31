import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';
import GeoJSON from 'ol/format/GeoJSON';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import { ImageWMS, TileWMS } from 'ol/source';
import { LayerGetFeatureInfoResponse } from '../../types';
import Layer, { OlLayerOptions } from './Layer';

/**
 * Class use to display a WMS layer.
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
class WMSLayer extends Layer {
  abortController?: AbortController;

  format: GeoJSON;

  olLayer?: TileLayer<TileWMS> | ImageLayer<ImageWMS>;

  /**
   * @override
   */
  constructor(options: OlLayerOptions) {
    super(options);

    /** @private */
    this.abortController = new AbortController();
    /** @private */
    this.format = new GeoJSON();
  }

  /**
   * Get features infos' Url.
   * @param {ol/coordinate~Coordinate} coord
   * @return {ol/layer/Layer~Layer}
   */
  getFeatureInfoUrl(coord: Coordinate): string | undefined {
    if (!this.map) {
      return;
    }

    const projection = this.map.getView().getProjection();
    const resolution = this.map.getView().getResolution();

    if (
      resolution &&
      projection &&
      this.olLayer?.getSource()?.getFeatureInfoUrl
    ) {
      // eslint-disable-next-line consistent-return
      return this.olLayer
        ?.getSource()
        ?.getFeatureInfoUrl(coord, resolution, projection, {
          info_format: 'application/json',
          query_layers: this.olLayer?.getSource()?.getParams().layers,
        });
    }
  }

  /**
   * Request feature information for a given coordinate.
   * @param {ol/coordinate~Coordinate} coordinate to request the information at.
   * @return {Promise<FeatureInfo>} Promise with features, layer and coordinate.
   */
  getFeatureInfoAtCoordinate(
    coordinate: Coordinate,
  ): Promise<LayerGetFeatureInfoResponse> {
    this.abortController?.abort();
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    const url = this.getFeatureInfoUrl(coordinate);
    if (!url) {
      // eslint-disable-next-line no-console
      console.error('No url for the WMS layer.');
      // resolve an empty feature array something fails
      return Promise.resolve({
        features: [],
        coordinate,
        layer: this,
      });
    }

    return fetch(url, { signal })
      .then((resp) => resp.json())
      .then((r) => r.features)
      .then((data) => ({
        layer: this,
        coordinate,
        features: data.map((d: Feature) => this.format.readFeature(d)),
      }))
      .catch(() =>
        // resolve an empty feature array something fails
        Promise.resolve({
          features: [],
          coordinate,
          layer: this,
        }),
      );
  }

  /**
   * Create a copy of the WMSLayer.
   * @param {Object} newOptions Options to override
   * @return {WMSLayer} A WMSLayer
   */
  clone(newOptions: OlLayerOptions) {
    return new WMSLayer({ ...this.options, ...newOptions });
  }
}

export default WMSLayer;
