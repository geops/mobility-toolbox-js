import debounce from 'lodash.debounce';
import { Layer } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import { Source } from 'ol/source';

import { VECTOR_TILE_FEATURE_PROPERTY } from '../../common';
import MaplibreStyleLayerRenderer from '../renderers/MaplibreStyleLayerRenderer';
import defineDeprecatedProperties from '../utils/defineDeprecatedProperties';

import type { AddLayerObject, FeatureState } from 'maplibre-gl';
import type { Feature, Map } from 'ol';
import type { EventsKey } from 'ol/events';
import type { ObjectEvent } from 'ol/Object';

import type { FilterFunction } from '../../common/typedefs';

import type { MobilityLayerOptions } from './Layer';
import type { MaplibreLayerOptions } from './MaplibreLayer';
import type MaplibreLayer from './MaplibreLayer';

export type MaplibreStyleLayerOptions = {
  beforeId?: string;
  layers?: maplibregl.AddLayerObject[];
  layersFilter?: FilterFunction;
  maplibreLayer?: MaplibreLayer;
  queryRenderedLayersFilter?: FilterFunction;
} & MaplibreLayerOptions &
  MobilityLayerOptions;

let deprecated: (...messages: (object | string)[]) => void = () => {};
if (
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('deprecated')
) {
  deprecated = debounce((...messages: (object | string)[]) => {
    // eslint-disable-next-line no-console
    console.warn(...messages);
  }, 1000);
}

/**
 * Layer that helps show/hide a specific subset of style layers of a [MaplibreLayer](./MaplibreLayer.js~MaplibreLayer.html).
 *
 * @example
 * import { MaplibreLayer, MocoLayer } from 'mobility-toolbox-js/ol';
 *
 * const maplibreLayer = new MaplibreLayer({
 *   apiKey: 'yourApiKey',
 * });
 *
 * const layer = new MocoLayer({
 *   maplibreLayer: maplibreLayer,
 *   layersFilter: (layer) => {
 *     // show/hide only style layers related to stations
 *     return /station/.test(layer.id);
 *   },
 * });
 *
 * @extends {ol/layer/Layer~Layer}
 * @public
 */
class MaplibreStyleLayer extends Layer {
  highlightedFeatures: Feature[] = [];

  public olEventsKeys: EventsKey[] = [];

  selectedFeatures: Feature[] = [];

  get beforeId(): string | undefined {
    return this.get('beforeId') as string | undefined;
  }

  set beforeId(newValue: string | undefined) {
    this.set('beforeId', newValue);
  }

  get layers(): maplibregl.AddLayerObject[] {
    return (this.get('layers') as maplibregl.AddLayerObject[]) || [];
  }

  set layers(newValue: maplibregl.AddLayerObject[]) {
    this.set('layers', newValue);
  }

  get layersFilter(): (layer: maplibregl.LayerSpecification) => boolean {
    return this.get('layersFilter') as (
      layer: maplibregl.LayerSpecification,
    ) => boolean;
  }

  set layersFilter(
    newValue: (layer: maplibregl.LayerSpecification) => boolean,
  ) {
    this.set('layersFilter', newValue);
  }

  /**
   * @deprecated Use MaplibreStyleLayer.maplibreLayer instead.
   */
  get mapboxLayer(): MaplibreLayer | undefined {
    deprecated('Deprecated. Use maplibreLayer instead.');
    return this.get('maplibreLayer') as MaplibreLayer | undefined;
  }

  get maplibreLayer(): MaplibreLayer | undefined {
    return this.get('maplibreLayer') as MaplibreLayer | undefined;
  }

  set maplibreLayer(newValue: MaplibreLayer | undefined) {
    this.set('maplibreLayer', newValue);
  }

  get queryRenderedLayersFilter(): (
    layer: maplibregl.LayerSpecification,
  ) => boolean {
    return this.get('queryRenderedLayersFilter') as (
      layer: maplibregl.LayerSpecification,
    ) => boolean;
  }

  set queryRenderedLayersFilter(
    newValue: (layer: maplibregl.LayerSpecification) => boolean,
  ) {
    this.set('queryRenderedLayersFilter', newValue);
  }

  get sources(): Record<string, maplibregl.SourceSpecification> {
    return this.get('sources') as Record<
      string,
      maplibregl.SourceSpecification
    >;
  }

  set sources(newValue: Record<string, maplibregl.SourceSpecification>) {
    this.set('sources', newValue);
  }

  /**
   * @deprecated Use MaplibreStyleLayer.layer instead.
   */
  get styleLayer(): maplibregl.AddLayerObject {
    deprecated('Deprecated. Use MaplibreStyleLayer.layer instead.');
    return this.layers[0];
  }

  /**
   * @deprecated
   */
  set styleLayer(newValue: maplibregl.AddLayerObject) {
    deprecated(
      'MaplibreStyleLayer.styleLayer is deprecated. Use MaplibreStyleLayer.layer instead.',
    );
    this.layers = [newValue];
  }

  /**
   * Apply visibility to style layers that fits the styleLayersFilter function.
   */
  /**
   * @deprecated
   */
  get styleLayers(): maplibregl.AddLayerObject[] {
    deprecated(
      'MaplibreStyleLayer.styleLayers is deprecated. Use MaplibreStyleLayer.layers instead.',
    );
    return this.layers;
  }

  /**
   * @deprecated
   */
  set styleLayers(newValue: maplibregl.AddLayerObject[]) {
    deprecated(
      'MaplibreStyleLayer.styleLayers is deprecated. Use MaplibreStyleLayer.layers instead.',
    );
    this.layers = newValue;
  }

  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {string} [options.beforeId] The style layer id to use when the options.layers property is defined, unsused otherwise.
   * @param {maplibregl.AddLayerObject[]} [options.layers] The layers to add to the style on load.
   * @param {FilterFunction} [options.layersFilter] Filter function to decide which style layer to apply visiblity on. If not provided, the 'layers' property is used.
   * @param {MaplibreLayer} [options.maplibreLayer] The MaplibreLayer to use.
   * @param {FilterFunction} [options.queryRenderedLayersFilter] Filter function to decide which style layer are available for query.
   * @param {{[id: string]:maplibregl.SourceSpecification}} [options.sources] The sources to add to the style on load.
   * @public
   */
  constructor(
    options: MaplibreStyleLayerOptions = {
      mapLibreOptions: { style: { layers: [], sources: {}, version: 8 } },
    },
  ) {
    /** Manage renamed property for backward compatibility with v2  */
    if (options.mapboxLayer) {
      deprecated(
        'options.mapboxLayer is deprecated. Use options.maplibreLayer instead.',
      );
      // @ts-expect-error - mapboxLayer is deprecated
      options.maplibreLayer = options.mapboxLayer;
      delete options.mapboxLayer;
    }

    if (options.styleLayer) {
      deprecated(
        'options.styleLayer is deprecated. Use options.layers instead.',
      );
      options.layers = [options.styleLayer] as AddLayerObject[];
      delete options.styleLayer;
    }

    if (options.styleLayers) {
      deprecated(
        'options.styleLayers is deprecated. Use options.layers instead.',
      );
      options.layers = options.styleLayers as AddLayerObject[];
      delete options.styleLayers;
    }

    if (options.styleLayersFilter) {
      deprecated(
        'options.styleLayersFilter is deprecated. Use options.layersFilter instead.',
      );
      options.layersFilter = options.styleLayersFilter as FilterFunction;
      delete options.styleLayersFilter;
    }

    super({ source: new Source({}), ...options });

    // For backward compatibility with v2
    defineDeprecatedProperties(this, options);

    // For cloning
    this.set('options', options);

    this.beforeId = options.beforeId;

    this.onLoad = this.onLoad.bind(this);

    if (!this.layersFilter && this.layers) {
      this.layersFilter = (layer: maplibregl.LayerSpecification) => {
        return !!this.layers.find((l) => {
          return layer.id === l.id;
        });
      };
    }
  }

  addLayers() {
    if (!this.maplibreLayer?.mapLibreMap || !Array.isArray(this.layers)) {
      return;
    }
    const { mapLibreMap } = this.maplibreLayer;

    if (mapLibreMap) {
      this.layers.forEach((layer) => {
        // @ts-expect-error  source is optional but exists in TS definition
        const { id, source }: { id: string; source?: string } = layer;
        if (
          (!source || (source && mapLibreMap.getSource(source))) &&
          id &&
          !mapLibreMap.getLayer(id)
        ) {
          mapLibreMap.addLayer(layer, this.beforeId);
        }
      });
      this.applyLayoutVisibility();
    }
  }

  addSources() {
    if (!this.maplibreLayer?.mapLibreMap || !this.sources) {
      return;
    }
    const { mapLibreMap } = this.maplibreLayer;

    if (mapLibreMap) {
      Object.entries(this.sources).forEach(([id, source]) => {
        if (!mapLibreMap.getSource(id)) {
          mapLibreMap.addSource(id, source);
        }
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyLayoutVisibility(evt?: ObjectEvent) {
    if (!this.maplibreLayer?.mapLibreMap?.getStyle() || !this.layersFilter) {
      return;
    }

    const { mapLibreMap } = this.maplibreLayer;
    const style = mapLibreMap.getStyle();
    const visibilityValue = this.getVisible() ? 'visible' : 'none';
    const layers = style.layers || [];

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < layers.length; i += 1) {
      const layer = layers[i];

      if (this.layersFilter(layer)) {
        const { id } = layer;

        if (mapLibreMap.getLayer(id)) {
          mapLibreMap.setLayoutProperty(id, 'visibility', visibilityValue);

          if (this.getMinZoom() || this.getMaxZoom()) {
            mapLibreMap.setLayerZoomRange(
              id,
              Number.isFinite(this.getMinZoom()) ? this.getMinZoom() - 1 : 0, // Maplibre zoom = ol zoom - 1
              Number.isFinite(this.getMaxZoom()) ? this.getMaxZoom() - 1 : 24,
            );
          }
        }
      }
    }
  }

  /**
   * Initialize the layer.
   * @param {ol/Map~Map} map the Maplibre map.
   * @override
   */
  attachToMap(map: Map) {
    const mapInternal = this.getMapInternal();
    if (!mapInternal || !this.maplibreLayer) {
      return;
    }

    // Apply the initial visibility if possible otherwise we wait for the load event of the layer
    const { mapLibreMap } = this.maplibreLayer;
    if (mapLibreMap) {
      // mapLibreMap.loaded() and mapLibreMap.isStyleLoaded() are reliable only on the first call of init.
      // On the next call (when a topic change for example), these functions returns false because
      // the style is being modified.
      // That's why we rely on a property instead for the next calls.
      if (mapLibreMap.loaded()) {
        this.onLoad();
      } else {
        if (mapLibreMap.isStyleLoaded()) {
          this.onLoad();
        } else {
          // eslint-disable-next-line @typescript-eslint/unbound-method
          void mapLibreMap.once('load', this.onLoad);
        }
      }
    }

    // Apply the visibiltity when layer's visibility change.
    this.olEventsKeys.push(
      // @ts-expect-error  'load' is a custom event
      this.maplibreLayer.on('load', this.onLoad.bind(this)),

      this.on('change:visible', (evt) => {
        // Once the map is loaded we can apply visiblity without waiting
        // the style. Maplibre take care of the application of style changes.
        this.applyLayoutVisibility(evt);
      }),

      this.on('propertychange', (evt: ObjectEvent) => {
        if (
          /(sources|layers|layersFilter|maplibreLayer|beforeId)/.test(evt.key)
        ) {
          this.detachFromMap();
          this.attachToMap(map);
        }
      }),

      // When the style changes we wait that it is loaded to relaunch the onLoad
      this.maplibreLayer.on('propertychange', (evt: ObjectEvent) => {
        if (evt.key === 'style') {
          const mbMap = (evt.target as MaplibreLayer).mapLibreMap;
          void mbMap?.once('styledata', () => {
            void mbMap?.once('idle', () => {
              this.onLoad();
            });
          });
        }
      }),
    );
  }

  /**
   * Create a copy of the MaplibreStyleLayer.
   *
   * @param {Object} newOptions Options to override. See constructor.
   * @return {MapboxStyleLayer} A MaplibreStyleLayer.
   * @public
   */
  clone(newOptions: MaplibreStyleLayerOptions): MaplibreStyleLayer {
    return new MaplibreStyleLayer({
      ...((this.get('options') as MaplibreStyleLayerOptions) || {}),
      ...(newOptions || {}),
    });
  }

  createRenderer() {
    return new MaplibreStyleLayerRenderer(this);
  }

  /**
   * Terminate the layer.
   * @override
   */
  detachFromMap() {
    unByKey(this.olEventsKeys);
    if (this.maplibreLayer?.mapLibreMap) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.maplibreLayer.mapLibreMap.off('load', this.onLoad);
      this.removeLayers();
      this.removeSources();
    }
  }

  // /**
  //  * Request feature information for a given coordinate.
  //  * @param {ol/coordinate~Coordinate} coordinate Coordinate to request the information at.
  //  * @return {Promise<FeatureInfo>} Promise with features, layer and coordinate.
  //  * @deprecated Use getFeatureInfoAtCoordinate([layer], coordinate) from mobility-toolbox-ol package instead.
  //  */
  // getFeatureInfoAtCoordinate(
  //   coordinate: Coordinate,
  // ): Promise<LayerGetFeatureInfoResponse> {
  //   deprecated(
  //     `Deprecated. getFeatureInfoAtCoordinate([layer], coordinate) from ol package instead.`,
  //   );
  //   if (!this.maplibreLayer?.mapLibreMap) {
  //     return Promise.resolve({ coordinate, features: [], layer: this });
  //   }
  //   const { mapLibreMap } = this.maplibreLayer;

  //   // Ignore the getFeatureInfo until the Maplibre map is loaded
  //   if (!mapLibreMap.isStyleLoaded()) {
  //     return Promise.resolve({ coordinate, features: [], layer: this });
  //   }

  //   // We query features only on style layers used by this layer.
  //   let layers = this.layers || [];

  //   if (this.layersFilter) {
  //     layers = mapLibreMap.getStyle().layers.filter(this.layersFilter);
  //   }

  //   if (this.queryRenderedLayersFilter) {
  //     layers = mapLibreMap
  //       .getStyle()
  //       .layers.filter(this.queryRenderedLayersFilter);
  //   }

  //   return Promise.resolve({
  //     coordinate,
  //     features: [],
  //     layer: this,
  //   });

  //   // this.maplibreLayer
  //   //   .getFeatureInfoAtCoordinate(coordinate, {
  //   //     layers: layers.map((layer) => layer && layer.id),
  //   //     validate: false,
  //   //   })
  //   //   .then((featureInfo: LayerGetFeatureInfoResponse) => {
  //   //     const features: Feature[] = featureInfo.features.filter(
  //   //       (feature: Feature) => {
  //   //         // @ts-expect-error
  //   //         return this.featureInfoFilter(
  //   //           feature,
  //   //           this.map?.getView().getResolution(),
  //   //         ) as Feature[];
  //   //       },
  //   //     );
  //   //     this.highlight(features);
  //   //     return { ...featureInfo, features, layer: this };
  //   //   });
  // }

  /**
   * Highlight a list of features.
   * @param {Array<ol/Feature~Feature>} [features=[]] Features to highlight.
   * @deprecated Use layer.setFeatureState(features, {hover: true|false}) instead.
   */
  highlight(features: Feature[] = []) {
    deprecated(
      `Deprecated. Use layer.setFeatureState(features, {hover: true}) instead.`,
    );
    // Filter out selected features
    const filtered: Feature[] =
      this.highlightedFeatures?.filter((feature) => {
        return !(this.selectedFeatures || [])
          .map((feat: Feature) => {
            return feat.getId();
          })
          .includes(feature.getId());
      }) || [];

    // Remove previous highlight
    this.setHoverState(filtered, false);
    this.highlightedFeatures = features;

    // Add highlight
    this.setHoverState(this.highlightedFeatures, true);
  }

  /**
   * On Maplibre map load callback function. Add style layers and dynaimc filters.
   */
  onLoad() {
    if (!this.maplibreLayer?.mapLibreMap) {
      return;
    }
    this.addSources();
    this.addLayers();

    const { mapLibreMap } = this.maplibreLayer;
    const style = mapLibreMap.getStyle();
    if (style?.layers && this.layersFilter) {
      const styles = style.layers.filter(this.layersFilter);
      this.set('disabled', !styles.length);
    }
    this.applyLayoutVisibility();
  }

  removeLayers() {
    if (!this.maplibreLayer?.mapLibreMap || !Array.isArray(this.layers)) {
      return;
    }
    const { mapLibreMap } = this.maplibreLayer;

    if (mapLibreMap) {
      this.layers.forEach((styleLayer) => {
        const { id } = styleLayer;
        if (id && mapLibreMap?.getLayer(id)) {
          mapLibreMap.removeLayer(id);
        }
      });
    }
  }

  // /**
  //  * Set filter that determines which features should be rendered in a style layer.
  //  * @param {maplibregl.filter} filter Determines which features should be rendered in a style layer.
  //  */
  // setFilter(filter: { [key: string]: any }) {
  //   if (!this.maplibreLayer?.mapLibreMap) {
  //     return;
  //   }
  //   const { mapLibreMap } = this.maplibreLayer;

  //   this.styleLayers.forEach(({ id }) => {
  //     if (id && filter && mapLibreMap.getLayer(id)) {
  //       // @ts-expect-error
  //       mapLibreMap.setFilter(id, filter);
  //     }
  //   });
  // }

  removeSources() {
    if (!this.maplibreLayer?.mapLibreMap || !this.sources) {
      return;
    }
    const { mapLibreMap } = this.maplibreLayer;

    if (mapLibreMap) {
      Object.keys(this.sources).forEach((id) => {
        if (mapLibreMap.getSource(id)) {
          mapLibreMap.removeSource(id);
        }
      });
    }
  }

  /**
   * Select a list of features.
   * @param {Array<ol/Feature~Feature>} [features=[]] Features to select.
   * @deprecated Use layer.setFeatureState(features, {selected: true|false}) instead.
   */
  select(features: Feature[] = []) {
    deprecated(
      `Deprecated. Use layer.setFeatureState(features, {selected: true}) instead.`,
    );
    this.setHoverState(this.selectedFeatures || [], false);
    this.selectedFeatures = features;
    this.setHoverState(this.selectedFeatures || [], true);
  }

  /**
   * Set the [feature state](https://maplibre.org/maplibre-style-spec/expressions/#feature-state) of the features.
   *
   * @param {ol/Feature~Feature[]} features
   * @param {{[key: string]: any}} state The feature state
   * @public
   */
  setFeatureState(features: Feature[], state: FeatureState) {
    if (!this.maplibreLayer?.mapLibreMap || !features.length) {
      return;
    }
    const mapLibreMap = this.maplibreLayer.mapLibreMap;

    features.forEach((feature: Feature) => {
      const { source, sourceLayer } = (feature.get(
        VECTOR_TILE_FEATURE_PROPERTY,
      ) || {}) as {
        source?: string;
        sourceLayer?: string;
      };
      if ((!source && !sourceLayer) || !feature.getId()) {
        if (!feature.getId()) {
          deprecated(
            "No feature's id found. To use the feature state functionnality, tiles must be generated with --generate-ids. See https://github.com/Maplibre/tippecanoe#adding-calculated-attributes.",
            feature.getProperties(),
          );
        }
        return;
      }

      if (source) {
        mapLibreMap.setFeatureState(
          {
            id: feature.getId(),
            source,
            sourceLayer,
          },
          state,
        );
      } else {
        deprecated(
          'No source found for the feature. To use the feature state functionnality, a source must be defined.',
          feature.getProperties(),
        );
      }
    });
  }

  /**
   * Set if features are hovered or not.
   * @param {Array<ol/Feature~Feature>} features
   * @param {boolean} state Is the feature hovered
   * @deprecated Use layer.setFeatureState(features, {hover: true|false}) instead.
   */
  setHoverState(features: Feature[], state: boolean) {
    deprecated(
      `Deprecated. Use layer.setFeatureState(features, {hover: ${state}}) instead.`,
    );
    this.setFeatureState(features, { hover: state });
  }

  override setMapInternal(map: Map) {
    if (map) {
      super.setMapInternal(map);
      this.attachToMap(map);
    } else {
      this.detachFromMap();
      super.setMapInternal(map);
    }
  }
}

export default MaplibreStyleLayer;
