import { getUid } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';

import { getLayersAsFlatArray } from '../../common';
import { FeatureInfo } from '../../common/typedefs';

import type { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import type { Layer } from 'ol/layer';
import type BaseLayer from 'ol/layer/Base';
import type { ImageWMS, TileWMS } from 'ol/source';

import type { LayerGetFeatureInfoResponse } from '../../types';

/**
 * @private
 */
const format = new GeoJSON();

/**
 * @private
 */
const getFeaturesFromWMS = (
  source: ImageWMS | TileWMS,
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

  // @ts-expect-error url can be undefined
  return fetch(url, { signal: abortController.signal })
    .then((resp) => {
      return resp.json();
    })
    .then((featureCollection) => {
      return format.readFeatures(featureCollection);
    })
    .catch(() => {
      return [];
    });
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

  const flatLayers: BaseLayer[] = getLayersAsFlatArray(layers);

  const promises = flatLayers.map(async (baseLayer: BaseLayer) => {
    const map = (baseLayer as Layer).getMapInternal();
    const projection = map?.getView()?.getProjection()?.getCode();
    const emptyResponse = {
      coordinate,
      features: [],
      layer: baseLayer,
    } as LayerGetFeatureInfoResponse;

    if (!projection) {
      return Promise.resolve(emptyResponse);
    }
    const layer = baseLayer as Layer;

    // For backward compatibility
    // @ts-expect-error getFeatureInfoAtCoordinate is deprecated
    if (layer.getFeatureInfoAtCoordinate) {
      // @ts-expect-error getFeatureInfoAtCoordinate is deprecated
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return layer.getFeatureInfoAtCoordinate(
        coordinate,
      ) as Promise<LayerGetFeatureInfoResponse>;
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
      const features = await getFeaturesFromWMS(
        source,
        {
          coordinate,
          params: {
            info_format: 'application/json',
            query_layers: (source.getParams() as { layers: string }).layers,
          },
          projection,
          resolution,
        },
        abortControllers[id],
      ).catch(() => {
        return [];
      });
      const featureInfoResponse = {
        coordinate,
        features,
        layer,
      } as LayerGetFeatureInfoResponse;
      return Promise.resolve(featureInfoResponse);
    }

    // Other layers
    // For last resort we try the map function to get the features from the map
    const pixel = map?.getPixelFromCoordinate(coordinate);
    if (!pixel) {
      return Promise.resolve(emptyResponse);
    }

    const features = map?.getFeaturesAtPixel(pixel, {
      hitTolerance: (layer.get('hitTolerance') as number) || hitTolerance || 5,
      layerFilter: (l: Layer) => {
        return l === layer;
      },
    }) as Feature[];

    return Promise.resolve({
      coordinate,
      features,
      layer,
    } as LayerGetFeatureInfoResponse);
  });

  return Promise.all(promises);
};

export default getFeatureInfoAtCoordinate;
