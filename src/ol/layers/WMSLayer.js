import GeoJSON from 'ol/format/GeoJSON';
import Layer from './Layer';

/**
 * Class use to display a WMS layer.
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
class WMSLayer extends Layer {
  /**
   * @override
   */
  constructor(options = {}) {
    super(options);

    /** @ignore */
    this.abortController = new AbortController();
    /** @ignore */
    this.format = new GeoJSON();
  }

  /**
   * Get features infos' Url.
   * @param {ol/coordinate~Coordinate} coord
   * @return {ol/layer/Layer~Layer}
   */
  getFeatureInfoUrl(coord) {
    const projection = this.map.getView().getProjection();
    const resolution = this.map.getView().getResolution();

    if (this.olLayer.getSource().getFeatureInfoUrl) {
      return this.olLayer
        .getSource()
        .getFeatureInfoUrl(coord, resolution, projection, {
          info_format: 'application/json',
          query_layers: this.olLayer.getSource().getParams().layers,
        });
    }
    return false;
  }

  /**
   * Request feature information for a given coordinate.
   * @param {ol/coordinate~Coordinate} coordinate to request the information at.
   * @return {Promise<FeatureInfo>} Promise with features, layer and coordinate.
   */
  getFeatureInfoAtCoordinate(coordinate) {
    this.abortController.abort();
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    return fetch(this.getFeatureInfoUrl(coordinate), { signal })
      .then((resp) => resp.json())
      .then((r) => r.features)
      .then((data) => ({
        layer: this,
        coordinate,
        features: data.map((d) => this.format.readFeature(d)),
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
  clone(newOptions) {
    return new WMSLayer({ ...this.options, ...newOptions });
  }
}

export default WMSLayer;
