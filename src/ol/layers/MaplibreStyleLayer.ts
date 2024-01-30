/* eslint-disable no-param-reassign */
// @ts-nocheck
import { Feature, Map } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { AnyMapboxLayer, LayerGetFeatureInfoResponse } from '../../types';
import { FilterFunction } from '../../common/typedefs';
import { MaplibreLayerOptions } from './MaplibreLayer';
import MobilityLayerMixin from '../mixins/MobilityLayerMixin';

export type MapboxStyleLayerOptions = MaplibreLayerOptions & {
  beforeId?: string;
  mapboxLayer?: AnyMapboxLayer;
  styleLayer?: { [key: string]: any };
  styleLayers?: { [key: string]: any }[];
  styleLayersFilter?: FilterFunction;
  filters?: FilterFunction | { [key: string]: any }[];
  featureInfoFilter?: FilterFunction;
  queryRenderedLayersFilter?: FilterFunction;
};

export type StyleLayer = {
  id?: string;
  [key: string]: any;
};

/**
 * Layer for visualizing a specific set of layer from a MapboxLayer.
 *
 * @example
 * import { MapboxLayer, MapboxStyleLayer } from 'mobility-toolbox-js/ol';
 *
 * const mapboxLayer = new MapboxLayer({
 *   url: 'https://maps.geops.io/styles/travic_v2/style.json?key=[yourApiKey]',
 * });
 *
 * const layer = new MapboxStyleLayer({
 *   mapboxLayer: mapboxLayer,
 *   styleLayersFilter: () => {},
 * });
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {Layer}
 */
class MapboxStyleLayer extends MobilityLayerMixin(Layer) {
  beforeId?: string;

  mapboxLayer?: AnyMapboxLayer;

  styleLayersFilter?: FilterFunction;

  featureInfoFilter?: FilterFunction;

  queryRenderedLayersFilter?: FilterFunction;

  selectedFeatures?: Feature[];

  highlightedFeatures?: Feature[];

  styleLayer?: StyleLayer;

  styleLayers: StyleLayer[];

  addDynamicFilters?: () => void;

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {MapboxLayer} [options.mapboxLayer] The MapboxLayer to use.
   * @param {Function} [options.styleLayersFilter] Filter function to decide which style layer to display.
   */
  constructor(options: MapboxStyleLayerOptions) {
    super(options);

    /**
     * MapboxLayer provided for the style Layer.
     * @type {MapboxLayer}
     * @private
     */
    this.mapboxLayer = options.mapboxLayer;

    /**
     * Define if the layer has data to display in the current mapbox layer.
     */
    this.disabled = false;

    /**
     * Function to filter features to be displayed.
     * @type {function}
     * @private
     */
    this.styleLayersFilter = options.styleLayersFilter;

    /**
     * Mapbox style layer id where to add the style layers.
     * See [mapbox.map.addLayer](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addlayer) documentation.
     * @type {String}
     * @private
     */
    this.beforeId = options.beforeId;

    /**
     * Function to filter features for getFeatureInfoAtCoordinate method.
     * @type {function}
     * @private
     */
    this.featureInfoFilter = options.featureInfoFilter || ((obj: any) => obj);

    /**
     * Function to query the rendered features.
     * @type {function}
     * @private
     */
    this.queryRenderedLayersFilter = options.queryRenderedLayersFilter;

    /**
     * Array of features to highlight.
     * @type {Array<ol/Feature~Feature>}
     * @private
     */
    this.highlightedFeatures = [];

    /**
     * Array of selected features.
     * @type {Array<ol/Feature~Feature>}
     * @private
     */
    this.selectedFeatures = [];

    /**
     * Array of mapbox style layers to add.
     * @type {Array<mapboxgl.styleLayer>}
     * @private
     */
    this.styleLayers =
      (options.styleLayer ? [options.styleLayer] : options.styleLayers) || [];

    /**
     * @private
     */
    this.addStyleLayers = this.addStyleLayers.bind(this);

    /**
     * @private
     */
    this.onLoad = this.onLoad.bind(this);
    if (options.filters) {
      /** @private */
      this.addDynamicFilters = () => {
        this.setFilter(
          typeof options.filters === 'function'
            ? options.filters(this)
            : options.filters,
        );
      };
    }

    if (!this.styleLayersFilter && this.styleLayers) {
      this.styleLayersFilter = (styleLayer: StyleLayer) => {
        return !!this.styleLayers?.find((sl) => styleLayer.id === sl.id);
      };
    }
  }

  /**
   * Initialize the layer.
   * @param {ol/Map~Map} map the mapbox map.
   * @override
   */
  attachToMap(map: Map) {
    if (this.mapboxLayer && !this.mapboxLayer.map) {
      this.mapboxLayer?.attachToMap(map);
    }
    super.attachToMap(map);

    if (!this.map || !this.mapboxLayer) {
      return;
    }

    // Apply the initial visibiltity.
    const { mbMap } = this.mapboxLayer;
    if (!mbMap) {
      // If the mbMap is not yet created because the  map has no target yet, we
      // relaunch the initialisation when it's the case.
      this.olListenersKeys.push(
        this.map.on('change:target', () => {
          this.attachToMap(map);
        }),
      );

      return;
    }

    // mbMap.loaded() and mbMap.isStyleLoaded() are reliable only on the first call of init.
    // On the next call (when a topic change for example), these functions returns false because
    // the style is being modified.
    // That's why we rely on a property instead for the next calls.
    if (this.mapboxLayer.loaded || mbMap.isStyleLoaded() || mbMap.loaded()) {
      this.onLoad();
    } else {
      mbMap.once('load', this.onLoad);
    }

    // Apply the visibiltity when layer's visibility change.
    this.olListenersKeys.push(
      // @ts-ignore
      this.on('change:visible', (evt) => {
        // Once the map is loaded we can apply visiblity without waiting
        // the style. Mapbox take care of the application of style changes.
        this.applyLayoutVisibility(evt);
      }),
    );

    this.olListenersKeys.push(
      // @ts-ignore
      this.mapboxLayer.on('load', () => {
        this.onLoad();
      }),
    );
  }

  /**
   * Terminate the layer.
   * @override
   */
  detachFromMap() {
    if (this.mapboxLayer?.mbMap) {
      const { mbMap } = this.mapboxLayer;
      mbMap.off('load', this.onLoad);
      this.removeStyleLayers();
    }
    super.detachFromMap();
  }

  /** @private */
  addStyleLayers() {
    if (!this.mapboxLayer?.mbMap) {
      return;
    }
    const { mbMap } = this.mapboxLayer;

    this.styleLayers.forEach((styleLayer) => {
      const { id, source } = styleLayer;
      if (mbMap.getSource(source) && id && !mbMap.getLayer(id)) {
        // @ts-ignore
        mbMap.addLayer(styleLayer, this.beforeId);
      }
    });
    this.applyLayoutVisibility();
  }

  /** @private */
  removeStyleLayers() {
    if (!this.mapboxLayer?.mbMap) {
      return;
    }
    const { mbMap } = this.mapboxLayer;

    this.styleLayers.forEach((styleLayer) => {
      const { id } = styleLayer;
      if (id && mbMap.getLayer(id)) {
        mbMap.removeLayer(id);
      }
    });
  }

  /**
   * On Mapbox map load callback function. Add style layers and dynaimc filters.
   * @private
   */
  onLoad() {
    this.addStyleLayers();

    if (this.addDynamicFilters) {
      this.addDynamicFilters();
    }

    if (!this.mapboxLayer?.mbMap) {
      return;
    }
    const { mbMap } = this.mapboxLayer;
    const style = mbMap.getStyle();
    if (style && this.styleLayersFilter) {
      // @ts-ignore
      const styles = style.layers.filter(this.styleLayersFilter);
      this.disabled = !styles.length;
    }
  }

  /**
   * Request feature information for a given coordinate.
   * @param {ol/coordinate~Coordinate} coordinate Coordinate to request the information at.
   * @return {Promise<FeatureInfo>} Promise with features, layer and coordinate.
   */
  getFeatureInfoAtCoordinate(
    coordinate: Coordinate,
  ): Promise<LayerGetFeatureInfoResponse> {
    if (!this.mapboxLayer?.mbMap) {
      return Promise.resolve({ coordinate, features: [], layer: this });
    }
    const { mbMap } = this.mapboxLayer;

    // Ignore the getFeatureInfo until the mapbox map is loaded
    if (!mbMap.isStyleLoaded()) {
      return Promise.resolve({ coordinate, features: [], layer: this });
    }

    // We query features only on style layers used by this layer.
    let layers = this.styleLayers || [];

    if (this.styleLayersFilter) {
      // @ts-ignore
      layers = mbMap.getStyle().layers.filter(this.styleLayersFilter);
    }

    if (this.queryRenderedLayersFilter) {
      // @ts-ignore
      layers = mbMap.getStyle().layers.filter(this.queryRenderedLayersFilter);
    }

    return this.mapboxLayer
      .getFeatureInfoAtCoordinate(coordinate, {
        layers: layers.map((layer) => layer && layer.id),
        validate: false,
      })
      .then((featureInfo: LayerGetFeatureInfoResponse) => {
        const features: Feature[] = featureInfo.features.filter(
          (feature: Feature) => {
            // @ts-ignore
            return this.featureInfoFilter(
              feature,
              this.map?.getView().getResolution(),
            ) as Feature[];
          },
        );
        this.highlight(features);
        return { ...featureInfo, features, layer: this };
      });
  }

  /**
   * Set filter that determines which features should be rendered in a style layer.
   * @param {mapboxgl.filter} filter Determines which features should be rendered in a style layer.
   */
  setFilter(filter: { [key: string]: any }) {
    if (!this.mapboxLayer?.mbMap) {
      return;
    }
    const { mbMap } = this.mapboxLayer;

    this.styleLayers.forEach(({ id }) => {
      if (id && filter && mbMap.getLayer(id)) {
        // @ts-ignore
        mbMap.setFilter(id, filter);
      }
    });
  }

  /**
   * Set if features are hovered or not.
   * @param {Array<ol/Feature~Feature>} features
   * @param {boolean} state Is the feature hovered
   * @private
   */
  setHoverState(features: Feature[], state: boolean) {
    if (!this.mapboxLayer?.mbMap) {
      return;
    }
    const { mbMap } = this.mapboxLayer;

    if (!features || !mbMap) {
      return;
    }

    features.forEach((feature: Feature) => {
      const { source, sourceLayer } = feature.get('mapboxFeature') || {};
      if ((!source && !sourceLayer) || !feature.getId()) {
        if (!feature.getId()) {
          // eslint-disable-next-line no-console
          console.warn(
            "No feature's id found. To use the feature state functionnality, tiles must be generated with --generate-ids. See https://github.com/mapbox/tippecanoe#adding-calculated-attributes.",
            feature.getId(),
            feature.getProperties(),
          );
        }
        return;
      }

      mbMap.setFeatureState(
        {
          id: feature.getId(),
          source,
          sourceLayer,
        },
        { hover: state },
      );
    });
  }

  /**
   * Select a list of features.
   * @param {Array<ol/Feature~Feature>} [features=[]] Features to select.
   * @private
   */
  select(features: Feature[] = []) {
    this.setHoverState(this.selectedFeatures || [], false);
    this.selectedFeatures = features;
    this.setHoverState(this.selectedFeatures || [], true);
  }

  /**
   * Highlight a list of features.
   * @param {Array<ol/Feature~Feature>} [features=[]] Features to highlight.
   * @private
   */
  highlight(features: Feature[] = []) {
    // Filter out selected features
    const filtered: Feature[] =
      this.highlightedFeatures?.filter(
        (feature) =>
          !(this.selectedFeatures || [])
            .map((feat: Feature) => feat.getId())
            .includes(feature.getId()),
      ) || [];

    // Remove previous highlight
    this.setHoverState(filtered, false);
    this.highlightedFeatures = features;

    // Add highlight
    this.setHoverState(this.highlightedFeatures, true);
  }

  /**
   * Apply visibility to style layers that fits the styleLayersFilter function.
   * @param {Event} evt Layer's event that has called the function.
   * @private
   */
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  applyLayoutVisibility(evt?: ObjectEvent) {
    const { visible } = this;
    const filterFunc = this.styleLayersFilter;

    if (!this.mapboxLayer?.mbMap) {
      return;
    }

    const { mbMap } = this.mapboxLayer;
    const style = mbMap.getStyle();

    if (!style) {
      return;
    }

    if (filterFunc) {
      const visibilityValue = visible ? 'visible' : 'none';
      const layers = style.layers || [];
      for (let i = 0; i < layers.length; i += 1) {
        const styleLayer = layers[i];
        if (filterFunc(styleLayer)) {
          if (mbMap.getLayer(styleLayer.id)) {
            mbMap.setLayoutProperty(
              styleLayer.id,
              'visibility',
              visibilityValue,
            );
            if (this.get('minZoom') || this.get('maxZoom')) {
              mbMap.setLayerZoomRange(
                styleLayer.id,
                this.get('minZoom') ? this.get('minZoom') - 1 : 0, // mapbox zoom = ol zoom - 1
                this.get('maxZoom') ? this.get('maxZoom') - 1 : 24,
              );
            }
          }
        }
      }
    }
  }

  /**
   * Create a copy of the MapboxStyleLayer.
   * @param {Object} newOptions Options to override.
   * @return {MapboxStyleLayer} A MapboxStyleLayer.
   */
  clone(newOptions: MapboxStyleLayerOptions) {
    return new MapboxStyleLayer({ ...this.options, ...newOptions });
  }
}

export default MapboxStyleLayer;
