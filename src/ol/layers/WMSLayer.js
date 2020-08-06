import GeoJSON from 'ol/format/GeoJSON';
import { unByKey } from 'ol/Observable';
import Layer from './Layer';

/**
 * Class use to display a WMS layer.
 *
 * @extends {Layer}
 */
class WMSLayer extends Layer {
  /**
   * @inheritdoc
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
   * @returns {ol/layer/Layer~Layer}
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
   * @returns {Promise<Object>} Promise with features, layer and coordinate
   *  or null if no feature was hit.
   * eslint-disable-next-line class-methods-use-this
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
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map}
   */
  init(map) {
    super.init(map);

    if (!this.map) {
      return;
    }

    /**
     * ol click events key, returned by map.on('singleclick')
     * @private
     * @type {ol/events~EventsKey}
     */
    this.singleClickRef = this.map.on('singleclick', (e) => {
      if (!this.clickCallbacks.length) {
        return;
      }

      this.getFeatureInfoAtCoordinate(e.coordinate).then((data) =>
        this.callClickCallbacks(data.features, data.layer, data.coordinate),
      );
    });
  }

  /**
   * Call click callbacks with given parameters.
   * This is done in a separate function for being able to modify the response.
   * @param {Array<ol/Feature~Feature>} features
   * @param {ol/layer/Layer~Layer} layer
   * @param {ol/coordinate~Coordinate} coordinate
   * @private
   */
  callClickCallbacks(features, layer, coordinate) {
    this.clickCallbacks.forEach((c) => c(features, layer, coordinate));
  }

  /**
   * Terminate what was initialized in init function. Remove layer, events...
   */
  terminate() {
    super.terminate();
    if (this.singleClickRef) {
      unByKey(this.singleClickRef);
    }
  }
}

export default WMSLayer;
