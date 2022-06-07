/* eslint-disable no-underscore-dangle */
import { toLonLat } from 'ol/proj';
import { Map } from 'maplibre-gl';
import Source from 'ol/source/Source';
import OLLayer from 'ol/layer/Layer';
import GeoJSON from 'ol/format/GeoJSON';
import { toDegrees } from 'ol/math';
import Layer from './Layer';
import { getMapboxMapCopyrights, getMapboxStyleUrl } from '../../common/utils';

/**
 * A class representing MaplibreLayer to display on BasicMap
 *
 * @example
 * import { MaplibreLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MaplibreLayer({
 *   url: 'https://maps.geops.io/styles/travic_v2/style.json',
 *   apikey: 'yourApiKey',
 * });
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
export default class MaplibreLayer extends Layer {
  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {boolean} [options.preserveDrawingBuffer=false] If true able to export the canvas.
   * @param {number} [options.fadeDuration=300] Duration of the fade effect in ms.
   */
  constructor(options = {}) {
    const mbLayer = new OLLayer({
      source: new Source({}),
      render: (frameState) => {
        if (!this.mbMap) {
          // eslint-disable-next-line no-console
          console.warn("Mapbox map doesn't exist.");
          return null;
        }

        const canvas = this.mbMap.getCanvas();
        const { viewState } = frameState;

        const opacity = this.olLayer.getOpacity();
        canvas.style.opacity = opacity;

        // adjust view parameters in mapbox
        this.mbMap.jumpTo({
          center: toLonLat(viewState.center),
          zoom: viewState.zoom - 1,
          bearing: toDegrees(-viewState.rotation),
          animate: false,
        });

        if (!canvas.isConnected) {
          // The canvas is not connected to the DOM, request a map rendering at the next animation frame
          // to set the canvas size.
          this.map.render();
        } else if (
          canvas.width !== frameState.size[0] ||
          canvas.height !== frameState.size[1]
        ) {
          this.mbMap.resize();
        }

        this.mbMap.redraw();

        return this.mbMap.getContainer();
      },
    });

    super({
      ...options,
      olLayer: mbLayer,
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
  init(map) {
    super.init(map);

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
  terminate() {
    if (this.mbMap) {
      this.mbMap.off('idle', this.updateAttribution);
      // Some asynchrone repaints are triggered even if the mbMap has been removed,
      // to avoid display of errors we set an empty function.
      this.mbMap.triggerRepaint = () => {};
      this.mbMap.remove();
      this.mbMap = null;
    }
    this.loaded = false;
    super.terminate();
  }

  /**
   * Returns a style URL with apiKey & apiKeyName infos.
   * @private
   */
  createStyleUrl() {
    return getMapboxStyleUrl(this.apiKey, this.apiKeyName, this.styleUrl);
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

    /**
     * A mapbox map
     * @type {mapboxgl.Map}
     */
    this.mbMap = new Map({
      style: this.createStyleUrl(),
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
      this.olLayer.getSource().setAttributions(newAttributions);
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

  /**
   * Create a copy of the MapboxLayer.
   * @param {Object} newOptions Options to override
   * @return {MapboxLayer} A MapboxLayer
   */
  clone(newOptions) {
    return new MaplibreLayer({ ...this.options, ...newOptions });
  }
}
