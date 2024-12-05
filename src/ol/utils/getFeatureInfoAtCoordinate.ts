import { Feature, getUid } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { ImageWMS, TileWMS } from 'ol/source';

import { getLayersAsFlatArray } from '../../common';
import { LayerGetFeatureInfoResponse } from '../../types';

import type { Coordinate } from 'ol/coordinate';
import type { Layer } from 'ol/layer';

/**
 * @private
 */
const format = new GeoJSON();

/**
 * @private
 */
const getFeaturesFromWMS = (
  source: TileWMS | ImageWMS,
  options: any,
  abortController: AbortController,
): Promise<LayerGetFeatureInfoResponse> => {
  let url;
  const { coordinate, params, projection, resolution } = options;
  if (source && resolution && projection) {
    url = source.getFeatureInfoUrl(coordinate, resolution, projection, {
      info_format: 'application/json',
      query_layers: source.getParams().layers,
      ...params,
    });
  }

  // @ts-expect-error
  return fetch(url, { signal: abortController.signal })
    .then((resp) => resp.json())
    .then((featureCollection) => format.readFeatures(featureCollection))
    .catch(() => []);
};

/**
 * @private
 */
let abortControllers: Record<string, AbortController | undefined> = {};

/**
 * @private
 */
const getFeatureInfoAtCoordinate = async (
  coordinate: Coordinate,
  layers: Layer[],
  hitTolerance = 5,
): Promise<LayerGetFeatureInfoResponse[]> => {
  // Kill all previous requests
  Object.values(abortControllers).forEach((abortController) => {
    abortController?.abort();
  });
  abortControllers = {};

  const flatLayers = getLayersAsFlatArray(layers);

  const promises = flatLayers.map((layer) => {
    const map = layer.getMapInternal();
    const projection = map?.getView()?.getProjection()?.getCode();
    const emptyResponse = { coordinate, features: [], layer };

    if (!projection) {
      return Promise.resolve(emptyResponse);
    }

    // For backward compatibility
    if (layer.getFeatureInfoAtCoordinate) {
      return layer.getFeatureInfoAtCoordinate(coordinate);
    }

    // WMS sources
    // Here we don't use instanceof, to be able to use this function if a layer comes from 2 different ol versions.
    const source = (layer as Layer<ImageWMS | TileWMS>)?.getSource();
    if (source?.getFeatureInfoUrl) {
      const id = getUid(layer);

      // Abort and recreates one controller per layer
      abortControllers[id]?.abort();
      abortControllers[id] = new AbortController();

      const resolution = map?.getView()?.getResolution();
      return getFeaturesFromWMS(
        source,
        {
          coordinate,
          params: {
            info_format: 'application/json',
            query_layers: source.getParams().layers,
          },
          projection,
          resolution,
        },
        abortControllers[id],
      )
        .then((features) => {
          return {
            coordinate,
            features,
            layer,
          };
        })
        .catch(() => {
          return {
            coordinate,
            features: [],
            layer,
          };
        });
    }

    // Other layers
    // For last resort we try the map function to get the features from the map
    const pixel = map?.getPixelFromCoordinate(coordinate);
    if (!pixel) {
      return Promise.resolve(emptyResponse);
    }

    const features = map?.getFeaturesAtPixel(pixel, {
      hitTolerance: layer.get('hitTolerance') || hitTolerance || 5,
      layerFilter: (l: Layer) => l === layer,
    }) as Feature[];

    return Promise.resolve({
      coordinate,
      features,
      layer,
    });
  });
  return Promise.all(promises);
};

export default getFeatureInfoAtCoordinate;
