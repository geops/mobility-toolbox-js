import { Feature, Map } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { Layer } from 'ol/layer';
import { LayerSpecification } from 'maplibre-gl';
import { Source } from 'ol/source';
import { LayerGetFeatureInfoResponse } from '../../types';
import { FilterFunction } from '../../common/typedefs';
import MaplibreLayer, { MaplibreLayerOptions } from './MaplibreLayer';
import MobilityLayerMixin from '../mixins/MobilityLayerMixin';
import MaplibreStyleLayerRenderer from '../renderers/MaplibreStyleLayerRenderer';
import { VECTOR_TILE_FEATURE_PROPERTY } from '../../common';

export type MaplibreStyleLayerOptions = MaplibreLayerOptions & {
  beforeId?: string;
  maplibreLayer?: MaplibreLayer;
  styleLayers?: maplibregl.AddLayerObject[];
  styleLayersFilter?: FilterFunction;
  queryRenderedLayersFilter?: FilterFunction;
};

/**
 * Layer for visualizing a specific set of layer from a MapboxLayer.
 *
 * @example
 * import { MapboxLayer, MapboxStyleLayer } from 'mobility-toolbox-js/ol';
 *
 * const maplibreLayer = new MapboxLayer({
 *   url: 'https://maps.geops.io/styles/travic_v2/style.json?key=[yourApiKey]',
 * });
 *
 * const layer = new MapboxStyleLayer({
 *   maplibreLayer: maplibreLayer,
 *   styleLayersFilter: () => {},
 * });
 *
 * @classproperty {ol/Map~Map} map - The map where the layer is displayed.
 * @extends {ol/layer/Layer~Layer}
 */
class MaplibreStyleLayer extends MobilityLayerMixin(Layer) {
  highlightedFeatures: Feature[] = [];

  selectedFeatures: Feature[] = [];

  get beforeId(): string {
    return this.get('beforeId');
  }

  set beforeId(newValue: string[]) {
    this.set('beforeId', newValue);
  }

  get layers(): maplibregl.AddLayerObject[] {
    return this.get('layers');
  }

  set layers(newValue: maplibregl.AddLayerObject[]) {
    this.set('layers', newValue);
  }

  get layersFilter(): (layer: maplibregl.LayerSpecification) => boolean {
    return this.get('layersFilter');
  }

  set layersFilter(
    newValue: (layer: maplibregl.LayerSpecification) => boolean,
  ) {
    this.set('layersFilter', newValue);
  }

  get mapboxLayer(): MaplibreLayer | undefined {
    // eslint-disable-next-line no-console
    console.warn('Deprecated. Use maplibreLayer instead.');
    return this.get('maplibreLayer');
  }

  get maplibreLayer(): MaplibreLayer {
    return this.get('maplibreLayer');
  }

  set maplibreLayer(newValue: MaplibreLayer) {
    this.set('maplibreLayer', newValue);
  }

  get queryRenderedLayersFilter(): (
    layer: maplibregl.LayerSpecification,
  ) => boolean {
    return this.get('queryRenderedLayersFilter');
  }

  set queryRenderedLayersFilter(
    newValue: (layer: maplibregl.LayerSpecification) => boolean,
  ) {
    this.set('queryRenderedLayersFilter', newValue);
  }

  get sources(): { [key: string]: maplibregl.SourceSpecification } {
    return this.get('sources');
  }

  set sources(newValue: { [key: string]: maplibregl.SourceSpecification }) {
    this.set('sources', newValue);
  }

  /**
   * @deprecated
   */
  get styleLayer(): maplibregl.AddLayerObject {
    // eslint-disable-next-line no-console
    console.warn('Deprecated. Use layers instead.');
    return this.layers[0];
  }

  /**
   * @deprecated
   */
  set styleLayer(newValue: maplibregl.AddLayerObject) {
    // eslint-disable-next-line no-console
    console.warn('Deprecated. Use layers instead.');
    this.layers = [newValue];
  }

  /**
   * @deprecated
   */
  get styleLayers(): maplibregl.AddLayerObject[] {
    // eslint-disable-next-line no-console
    console.warn('Deprecated. Use layers instead.');
    return this.layers;
  }

  /**
   * @deprecated
   */
  set styleLayers(newValue: maplibregl.AddLayerObject[]) {
    // eslint-disable-next-line no-console
    console.warn('Deprecated. Use layers instead.');
    this.layers = newValue;
  }

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {MapboxLayer} [options.maplibreLayer] The MaplibreLayer to use.
   * @param {maplibregl.SourceSpecification[]} [options.sources] The source to add to the style on load.
   * @param {maplibregl.AddLayerObject[]} [options.layers] The layers to add to the style on load.
   * @param {FilterFunction} [options.layersFilter] Filter function to decide which style layer to apply visiblity on. If not provided, the 'layers' property is used.
   * @param {FilterFunction} [options.queryRenderedLayersFilter] Filter function to decide which style layer are available for query.
   */
  constructor(options: MaplibreStyleLayerOptions) {
    super({ source: new Source({}), ...(options || {}) });

    /**
     * @private
     */
    this.onLoad = this.onLoad.bind(this);

    if (!this.layersFilter && this.layers) {
      this.layersFilter = (layer: maplibregl.LayerSpecification) => {
        return !!this.layers.find((l) => layer.id === l.id);
      };
    }
  }

  createRenderer() {
    return new MaplibreStyleLayerRenderer(this);
  }

  /**
   * Initialize the layer.
   * @param {ol/Map~Map} map the Maplibre map.
   * @override
   */
  attachToMap(map: Map) {
    if (this.maplibreLayer && !this.maplibreLayer.map) {
      map.addLayer(this.maplibreLayer);
    }
    super.attachToMap(map);

    if (!this.map || !this.maplibreLayer) {
      return;
    }

    // Apply the initial visibiltity.
    const { maplibreMap } = this.maplibreLayer;

    if (!maplibreMap) {
      // If the maplibreMap is not yet created because the  map has no target yet, we
      // relaunch the initialisation when it's the case.
      this.olListenersKeys.push(
        this.map.on('change:target', () => {
          this.attachToMap(map);
        }),
      );

      return;
    }

    // maplibreMap.loaded() and maplibreMap.isStyleLoaded() are reliable only on the first call of init.
    // On the next call (when a topic change for example), these functions returns false because
    // the style is being modified.
    // That's why we rely on a property instead for the next calls.
    if (maplibreMap.loaded()) {
      this.onLoad();
    } else {
      maplibreMap.once('load', this.onLoad);
    }

    // Apply the visibiltity when layer's visibility change.
    this.olListenersKeys.push(
      // @ts-expect-error 'load' is a custom event form mobility-toolbox-js
      this.maplibreLayer.on('load', this.onLoad.bind(this)),

      this.on('change:visible', (evt) => {
        // Once the map is loaded we can apply visiblity without waiting
        // the style. Maplibre take care of the application of style changes.
        this.applyLayoutVisibility(evt);
      }),

      this.on('propertychange', (evt: ObjectEvent) => {
        if (
          /(sources|layers|layersFilter|maplibreLayer|beforeId|)/.test(evt.key)
        ) {
          this.detachFromMap();
          this.attachToMap(map);
        }
      }),
    );
  }

  /**
   * Terminate the layer.
   * @override
   */
  detachFromMap() {
    if (this.maplibreLayer?.maplibreMap) {
      this.maplibreLayer.maplibreMap.off('load', this.onLoad);
      this.removeLayers();
      this.removeSources();
    }
    super.detachFromMap();
  }

  /** @private */
  addSources() {
    if (!this.maplibreLayer?.maplibreMap || !this.sources) {
      return;
    }
    const { maplibreMap } = this.maplibreLayer;

    if (maplibreMap) {
      Object.entries(this.sources).forEach(([id, source]) => {
        if (!maplibreMap.getSource(id)) {
          maplibreMap.addSource(id, source);
        }
      });
    }
  }

  /** @private */
  removeSources() {
    if (!this.maplibreLayer?.maplibreMap || !this.sources) {
      return;
    }
    const { maplibreMap } = this.maplibreLayer;

    if (maplibreMap) {
      Object.keys(this.sources).forEach((id) => {
        if (maplibreMap.getSource(id)) {
          maplibreMap.removeSource(id);
        }
      });
    }
  }

  /** @private */
  addLayers() {
    if (!this.maplibreLayer?.maplibreMap || !Array.isArray(this.layers)) {
      return;
    }
    const { maplibreMap } = this.maplibreLayer;

    if (maplibreMap) {
      this.layers.forEach((layer) => {
        // @ts-expect-error source is optional but exists in TS definition
        const { id, source } = layer;
        if (
          (!source || (source && maplibreMap.getSource(source))) &&
          id &&
          !maplibreMap.getLayer(id)
        ) {
          maplibreMap.addLayer(layer, this.beforeId);
        }
      });
      this.applyLayoutVisibility();
    }
  }

  /** @private */
  removeLayers() {
    if (!this.maplibreLayer?.maplibreMap || !Array.isArray(this.layers)) {
      return;
    }
    const { maplibreMap } = this.maplibreLayer;

    if (maplibreMap) {
      this.layers.forEach((styleLayer) => {
        const { id } = styleLayer;
        if (id && maplibreMap.getLayer(id)) {
          maplibreMap.removeLayer(id);
        }
      });
    }
  }

  /**
   * On Maplibre map load callback function. Add style layers and dynaimc filters.
   * @private
   */
  onLoad() {
    if (!this.maplibreLayer?.maplibreMap) {
      return;
    }
    this.addSources();
    this.addLayers();

    const { maplibreMap } = this.maplibreLayer;
    const style = maplibreMap.getStyle();
    if (style?.layers && this.layersFilter) {
      const styles = style.layers.filter(this.layersFilter);
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
    if (!this.maplibreLayer?.maplibreMap) {
      return Promise.resolve({ coordinate, features: [], layer: this });
    }
    const { maplibreMap } = this.maplibreLayer;

    // Ignore the getFeatureInfo until the Maplibre map is loaded
    if (!maplibreMap.isStyleLoaded()) {
      return Promise.resolve({ coordinate, features: [], layer: this });
    }

    // We query features only on style layers used by this layer.
    let layers = this.layers || [];

    if (this.layersFilter) {
      layers = maplibreMap.getStyle().layers.filter(this.layersFilter);
    }

    if (this.queryRenderedLayersFilter) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layers = maplibreMap
        .getStyle()
        .layers.filter(this.queryRenderedLayersFilter);
    }

    return Promise.resolve({
      features: [],
      layer: this,
      coordinate,
    });

    // this.maplibreLayer
    //   .getFeatureInfoAtCoordinate(coordinate, {
    //     layers: layers.map((layer) => layer && layer.id),
    //     validate: false,
    //   })
    //   .then((featureInfo: LayerGetFeatureInfoResponse) => {
    //     const features: Feature[] = featureInfo.features.filter(
    //       (feature: Feature) => {
    //         // @ts-ignore
    //         return this.featureInfoFilter(
    //           feature,
    //           this.map?.getView().getResolution(),
    //         ) as Feature[];
    //       },
    //     );
    //     this.highlight(features);
    //     return { ...featureInfo, features, layer: this };
    //   });
  }

  // /**
  //  * Set filter that determines which features should be rendered in a style layer.
  //  * @param {maplibregl.filter} filter Determines which features should be rendered in a style layer.
  //  */
  // setFilter(filter: { [key: string]: any }) {
  //   if (!this.maplibreLayer?.maplibreMap) {
  //     return;
  //   }
  //   const { maplibreMap } = this.maplibreLayer;

  //   this.styleLayers.forEach(({ id }) => {
  //     if (id && filter && maplibreMap.getLayer(id)) {
  //       // @ts-ignore
  //       maplibreMap.setFilter(id, filter);
  //     }
  //   });
  // }

  /**
   * Set if features are hovered or not.
   * @param {Array<ol/Feature~Feature>} features
   * @param {boolean} state Is the feature hovered
   * @private
   */
  setHoverState(features: Feature[], state: boolean) {
    if (!this.maplibreLayer?.maplibreMap || !features.length) {
      return;
    }
    const { maplibreMap } = this.maplibreLayer;

    features.forEach((feature: Feature) => {
      const { source, sourceLayer } =
        feature.get(VECTOR_TILE_FEATURE_PROPERTY) || {};
      if ((!source && !sourceLayer) || !feature.getId()) {
        if (!feature.getId()) {
          // eslint-disable-next-line no-console
          console.warn(
            "No feature's id found. To use the feature state functionnality, tiles must be generated with --generate-ids. See https://github.com/Maplibre/tippecanoe#adding-calculated-attributes.",
            feature.getId(),
            feature.getProperties(),
          );
        }
        return;
      }

      maplibreMap.setFeatureState(
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
   *
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyLayoutVisibility(evt?: ObjectEvent) {
    if (!this.maplibreLayer?.maplibreMap?.getStyle() || !this.layersFilter) {
      return;
    }

    const { maplibreMap } = this.maplibreLayer;
    const style = maplibreMap.getStyle();
    const visibilityValue = this.getVisible() ? 'visible' : 'none';
    const layers = style.layers || [];

    for (let i = 0; i < layers.length; i += 1) {
      const layer = layers[i];

      if (this.layersFilter(layer)) {
        const { id } = layer;

        if (maplibreMap.getLayer(id)) {
          maplibreMap.setLayoutProperty(id, 'visibility', visibilityValue);

          if (this.getMinZoom() || this.getMaxZoom()) {
            maplibreMap.setLayerZoomRange(
              id,
              this.getMinZoom() ? this.getMinZoom() - 1 : 0, // Maplibre zoom = ol zoom - 1
              this.getMaxZoom() ? this.getMaxZoom() - 1 : 24,
            );
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
  clone(newOptions: MaplibreStyleLayerOptions): MaplibreStyleLayer {
    return new MaplibreStyleLayer({ ...this.options, ...newOptions });
  }
}

export default MaplibreStyleLayer;
