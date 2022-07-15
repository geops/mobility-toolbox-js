/* eslint-disable max-classes-per-file */
import { toLonLat } from 'ol/proj';
import OLLayer from 'ol/layer/Layer';
import Source from 'ol/source/Source';
import GeoJSON from 'ol/format/GeoJSON';
import { getUrlWithParams, getMapboxMapCopyrights } from '../utils';

/**
 * MapboxLayerInterface
 */
export class MapboxLayerInterface {
  /**
   * Return the render function function for the ol layer.
   *
   */
  // eslint-disable-next-line class-methods-use-this
  getOlLayerRender() {}

  /**
   * Return the Class to instanciate for the mapbox map.
   *
   * @return {mapboxgl.Map|maplibregl.Map} map
   */
  // eslint-disable-next-line class-methods-use-this
  getMapboxMapClass() {}
}

/**
 * Mixin for MapboxLayerLayerInterface.
 * It's used to share code between Mapbox and Maplibre layers without importing both libs
 *
 * @param {Class} Base A class to extend with {MapboxLayerLayerInterface} functionnalities.
 * @return {Class}  A class that implements {MapboxLayerLayerInterface} class and extends Base;
 * @private
 */
const MapboxLayerMixin = (Base) =>
  class extends Base {
    constructor(options = {}) {
      super(options);

      this.olLayer = new OLLayer({
        source: new Source({}),
        render: this.getOlLayerRender(this),
      });

      /**
       * Url of the mapbox style.
       * @type {string}
       * @private
       */
      this.styleUrl = options.url;

      /**
       * Api key for the url of the mapbox style.
       * If set to false, the apiKey is not required.
       * @type {string}
       * @private
       */
      this.apiKey = options.apiKey;

      /**
       * Name of the apiKey to set in the url request.
       * Default is 'key'.
       * @type {string}
       * @private
       */
      this.apiKeyName = options.apiKeyName || 'key';

      /** @ignore */
      this.updateAttribution = this.updateAttribution.bind(this);
    }

    /**
     * Initialize the layer and listen to feature clicks.
     * @param {ol/Map~Map} map
     */
    attachToMap(map) {
      super.attachToMap(map);

      if (!this.map) {
        return;
      }

      /**
       * The feature format.
       * @type {ol/format/GeoJSON}
       */
      this.format = new GeoJSON({
        featureProjection: this.map.getView().getProjection(),
      });

      this.loadMbMap();
    }

    /**
     * Terminate what was initialized in init function. Remove layer, events...
     */
    detachFromMap() {
      if (this.mbMap) {
        this.mbMap.off('idle', this.updateAttribution);
        // Some asynchrone repaints are triggered even if the mbMap has been removed,
        // to avoid display of errors we set an empty function.
        this.mbMap.triggerRepaint = () => {};
        this.mbMap.remove();
        this.mbMap = null;
      }
      this.loaded = false;
      super.detachFromMap();
    }

    /**
     * Create the mapbox map.
     * @private
     */
    loadMbMap() {
      this.olListenersKeys.push(
        this.map.on('change:target', () => {
          this.loadMbMap();
        }),
      );

      if (!this.map.getTargetElement()) {
        return;
      }

      if (!this.visible) {
        // On next change of visibility we load the map
        this.olListenersKeys.push(
          this.once('change:visible', () => {
            this.loadMbMap();
          }),
        );
        return;
      }

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.width = '100%';
      container.style.height = '100%';

      if (!this.apiKey && !this.styleUrl.includes(this.apiKeyName)) {
        // eslint-disable-next-line no-console
        console.error(
          `No apiKey defined for mapbox layer with style url to ${this.styleUrl}`,
        );
      }

      const Map = this.getMapboxMapClass();

      /**
       * A mapbox map
       * @type {mapboxgl.Map}
       */
      this.mbMap = new Map({
        style: getUrlWithParams(this.styleUrl, {
          [this.apiKeyName]: this.apiKey,
        }).toString(),
        container,
        interactive: false,
        trackResize: false,
        attributionControl: false,
        ...(this.options.mapOptions || {}),
      });

      this.mbMap.once('load', () => {
        /**
         * Is the map loaded.
         * @type {boolean}
         */
        this.loaded = true;

        this.dispatchEvent({
          type: 'load',
          target: this,
        });
      });

      this.mbMap.on('idle', this.updateAttribution);
    }

    /**
     * Update attributions of the source.
     * @private
     */
    updateAttribution(evt) {
      const newAttributions = getMapboxMapCopyrights(evt.target) || [];
      if (this.copyrights?.toString() !== newAttributions.toString()) {
        this.copyrights = newAttributions;
        this.olLayer.getSource()?.setAttributions(newAttributions);
      }
    }

    /**
     * Request feature information for a given coordinate.
     * @param {ol/coordinate~Coordinate} coordinate Coordinate to request the information at.
     * @param {Object} options A [mapboxgl.Map#queryrenderedfeatures](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#queryrenderedfeatures) options parameter.
     * @return {Promise<FeatureInfo>} Promise with features, layer and coordinate. The original Mapbox feature is available as a property named 'mapboxFeature'.
     */
    getFeatureInfoAtCoordinate(coordinate, options) {
      // Ignore the getFeatureInfo until the mapbox map is loaded
      if (
        !options ||
        !this.format ||
        !this.mbMap ||
        !this.mbMap.isStyleLoaded()
      ) {
        return Promise.resolve({ coordinate, features: [], layer: this });
      }

      let pixel = coordinate && this.mbMap.project(toLonLat(coordinate));

      if (this.hitTolerance) {
        const { x, y } = pixel;
        pixel = [
          { x: x - this.hitTolerance, y: y - this.hitTolerance },
          { x: x + this.hitTolerance, y: y + this.hitTolerance },
        ];
      }

      // At this point we get GeoJSON Mapbox feature, we transform it to an OpenLayers
      // feature to be consistent with other layers.
      const features = this.mbMap
        .queryRenderedFeatures(pixel, options)
        .map((feature) => {
          const olFeature = this.format.readFeature(feature);
          if (olFeature) {
            // We save the original mapbox feature to avoid losing informations
            // potentially needed for other functionnality like highlighting
            // (id, layer id, source, sourceLayer ...)
            olFeature.set('mapboxFeature', feature);
          }
          return olFeature;
        });

      return Promise.resolve({
        layer: this,
        features,
        coordinate,
      });
    }
  };

export default MapboxLayerMixin;
