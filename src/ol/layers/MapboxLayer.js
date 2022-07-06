/* eslint-disable no-underscore-dangle */
import { toLonLat } from 'ol/proj';
import { Map } from 'mapbox-gl';
import Source from 'ol/source/Source';
import OLLayer from 'ol/layer/Layer';
import GeoJSON from 'ol/format/GeoJSON';
import Layer from './Layer';
import { getMapboxMapCopyrights, getUrlWithParams } from '../../common/utils';

/**
 * A class representing Mapboxlayer to display on BasicMap
 *
 * @example
 * import { MapboxLayer } from 'mobility-toolbox-js/ol';
 *
 * const layer = new MapboxLayer({
 *   url: 'https://maps.geops.io/styles/travic_v2/style.json',
 *   apikey: 'yourApiKey',
 * });
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
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
        if (!this.map || !this.mbMap) {
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
  attachToMap(map) {
    super.attachToMap(map);

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

    // If the map hasn't been resized, the center could be [NaN,NaN].
    // We set default good value for the mapbox map, to avoid the app crashes.
    let [x, y] = this.map.getView().getCenter();
    if (!x || !y) {
      x = 0;
      y = 0;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.width = '100%';
    container.style.height = '100%';

    if (!this.apiKey && !this.styleUrl.includes(this.apiKeyName)) {
      // eslint-disable-next-line no-console
      console.warn(`No apiKey is defined for request to ${this.styleUrl}`);
    }

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
      this.mbMap.resize();
      /**
       * Is the map loaded.
       * @type {boolean}
       */
      this.loaded = true;

      /** @ignore */
      this.copyrights = getMapboxMapCopyrights(this.mbMap) || [];

      this.olLayer.getSource().setAttributions(this.copyrights);

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

  /**
   * Update attributions of the source.
   * @private
   */
  updateAttribution(evt) {
    const newAttributions = getMapboxMapCopyrights(evt.target) || [];
    if (this.copyrights.toString() !== newAttributions.toString()) {
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
    return new MapboxLayer({ ...this.options, ...newOptions });
  }
}
