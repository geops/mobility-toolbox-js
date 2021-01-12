/* eslint-disable no-underscore-dangle */
import { toLonLat } from 'ol/proj';
import mapboxgl from 'mapbox-gl';
import Source from 'ol/source/Source';
import OLLayer from 'ol/layer/Layer';
import GeoJSON from 'ol/format/GeoJSON';
import Layer from './Layer';
import getMapboxMapCopyrights from '../../common/utils/getMapboxMapCopyrights';
import getMapboxStyle from '../../common/utils/getMapboxStyle';

/**
 * A class representing Mapboxlayer to display on BasicMap
 *
 * @example
 * import { MapboxLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MapboxLayer({
 *   url: 'https://maps.geops.io/styles/travic/style.json',
 *   apikey: 'yourApiKey',
 * });
 *
 * @extends {Layer}
 */
export default class MapboxLayer extends Layer {
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
        let changed = false;
        const canvas = this.mbMap.getCanvas();
        const { viewState } = frameState;

        const visible = this.olLayer.getVisible();
        if (this.renderState.visible !== visible) {
          canvas.style.display = visible ? 'block' : 'none';
          this.renderState.visible = visible;
          // Needed since mapbox-gl 1.9.0.
          // Without you don't see others ol layers on top.
          canvas.style.position = 'absolute';
        }

        const opacity = this.olLayer.getOpacity();
        if (this.renderState.opacity !== opacity) {
          canvas.style.opacity = opacity;
          this.renderState.opacity = opacity;
        }

        // adjust view parameters in mapbox
        const { rotation } = viewState;
        if (this.renderState.rotation !== rotation) {
          this.mbMap.rotateTo((-(rotation || 0) * 180) / Math.PI, {
            animate: false,
          });
          changed = true;
          this.renderState.rotation = rotation;
        }

        if (
          this.renderState.zoom !== viewState.zoom ||
          this.renderState.center[0] !== viewState.center[0] ||
          this.renderState.center[1] !== viewState.center[1]
        ) {
          this.mbMap.jumpTo({
            center: toLonLat(viewState.center),
            zoom: viewState.zoom - 1,
            animate: false,
          });
          changed = true;
          this.renderState.zoom = viewState.zoom;
          this.renderState.center = viewState.center;
        }

        const size = this.map.getSize();
        if (
          this.renderState.size[0] !== size[0] ||
          this.renderState.size[1] !== size[1]
        ) {
          changed = true;
          this.renderState.size = size;
        }

        // cancel the scheduled update & trigger synchronous redraw
        // see https://github.com/mapbox/mapbox-gl-js/issues/7893#issue-408992184
        // NOTE: THIS MIGHT BREAK WHEN UPDATING MAPBOX
        if (
          this.mbMap &&
          this.mbMap.style &&
          this.mbMap.isStyleLoaded() &&
          changed
        ) {
          try {
            if (this.mbMap._frame) {
              this.mbMap._frame.cancel();
              this.mbMap._frame = null;
            }
            this.mbMap._render();
          } catch (err) {
            // ignore render errors because it's probably related to
            // a render during an update of the style.
            // eslint-disable-next-line no-console
            console.warn(err);
          }
        }

        return canvas;
      },
    });

    super({
      ...options,
      olLayer: mbLayer,
    });

    /** @ignore */
    this.options = options;

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

    /**
     * @ignores
     */
    this.updateAttribution = this.updateAttribution.bind(this);
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol/Map~Map} map
   */
  init(map) {
    super.init(map);

    if (!this.map || this.mbMap) {
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

    this.olListenersKeys.push(
      this.map.on('change:size', () => {
        try {
          if (this.mbMap) {
            this.mbMap.resize();
          }
        } catch (err) {
          // ignore render errors
          // eslint-disable-next-line no-console
          console.warn(err);
        }
      }),
    );
  }

  /**
   * Returns a style URL with apiKey & apiKeyName infos.
   */
  createStyleUrl() {
    return getMapboxStyle(this.apiKey, this.apiKeyName, this.styleUrl);
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

    // If the map hasn't been resized, the center could be [NaN,NaN].
    // We set default good value for the mapbox map, to avoid the app crashes.
    let [x, y] = this.map.getView().getCenter();
    if (!x || !y) {
      x = 0;
      y = 0;
    }

    const style = this.createStyleUrl();
    try {
      /**
       * A mapbox map
       * @type {mapboxgl.Map}
       */
      this.mbMap = new mapboxgl.Map({
        style,
        attributionControl: false,
        boxZoom: false,
        center: toLonLat([x, y]),
        container: this.map.getTargetElement(),
        interactive: false,
        fadeDuration:
          'fadeDuration' in this.options ? this.options.fadeDuration : 300,
        // Needs to be true to able to export the canvas, but could lead to performance issue on mobile.
        preserveDrawingBuffer: this.options.preserveDrawingBuffer || false,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed creating mapbox map: ', err);
    }

    // Options the last render run did happen. If something changes
    // we have to render again
    /** @ignore */
    this.renderState = {
      center: [x, y],
      zoom: null,
      rotation: null,
      visible: null,
      opacity: null,
      size: [0, 0],
    };

    this.mbMap.once('load', () => {
      /**
       * Is the map loaded.
       * @type {boolean}
       */
      this.loaded = true;

      this.olLayer
        .getSource()
        .setAttributions(this.copyrights || getMapboxMapCopyrights(this.mbMap));

      this.dispatchEvent({
        type: 'load',
        target: this,
      });
    });

    const mapboxCanvas = this.mbMap.getCanvas();
    if (mapboxCanvas) {
      if (this.options.tabIndex) {
        mapboxCanvas.setAttribute('tabindex', this.options.tabIndex);
      } else {
        // With a tabIndex='-1' the mouse events works but the map is not focused when we click on it
        // so we remove completely the tabIndex attribute.
        mapboxCanvas.removeAttribute('tabindex');
      }
    }
    this.mbMap.on('idle', this.updateAttribution);
  }

  updateAttribution(evt) {
    this.olLayer
      .getSource()
      .setAttributions(getMapboxMapCopyrights(evt.target));
  }

  /**
   * Request feature information for a given coordinate.
   * @param {ol/coordinate~Coordinate} coordinate Coordinate to request the information at.
   * @param {Object} options A [mapboxgl.Map#queryrenderedfeatures](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#queryrenderedfeatures) options parameter.
   * @returns {Promise<Object>} Promise with features, layer and coordinate
   *  or null if no feature was hit.
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

    const pixel = coordinate && this.mbMap.project(toLonLat(coordinate));
    // At this point we get GeoJSON Mapbox feature, we transform it to an OpenLayers
    // feature to be consistent with other layers.
    const features = this.mbMap
      .queryRenderedFeatures(pixel, options)
      .map((feature) => this.format.readFeature(feature));

    return Promise.resolve({
      layer: this,
      features,
      coordinate,
    });
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
   * Create exact copy of the MapboxLayer
   * @returns {MapboxLayer} MapboxLayer
   */
  clone() {
    return new MapboxLayer({ ...this.options, url: this.styleUrl });
  }
}
