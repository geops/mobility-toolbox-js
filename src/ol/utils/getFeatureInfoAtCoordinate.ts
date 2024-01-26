import type { Coordinate } from 'ol/coordinate';
import type { Layer } from 'ol/layer';
import { Feature, getUid } from 'ol';
import { ImageWMS, TileWMS } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import { LayerGetFeatureInfoResponse } from '../../types';

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
  const { coordinate, resolution, projection, params } = options;
  if (source && resolution && projection) {
    url = source.getFeatureInfoUrl(coordinate, resolution, projection, {
      info_format: 'application/json',
      query_layers: source.getParams().layers,
      ...params,
    });
  }

  // @ts-ignore
  return fetch(url, { signal: abortController.signal })
    .then((resp) => resp.json())
    .then((featureCollection) => format.readFeatures(featureCollection))
    .catch(() => []);
};

let abortControllers: {
  [key: string]: AbortController | undefined;
} = {};

/**
 * @private
 */
const getFeatureInfoAtCoordinate = async (
  coordinate: Coordinate,
  layers: Layer[],
  hitTolerance: number = 5,
): Promise<LayerGetFeatureInfoResponse[]> => {
  // Kill all previous requests
  Object.values(abortControllers).forEach((abortController) => {
    abortController?.abort();
  });
  abortControllers = {};

  const promises = layers.map((layer) => {
    const map = layer.getMapInternal();
    const projection = map?.getView()?.getProjection()?.getCode();
    const emptyResponse = { features: [], layer, coordinate };

    if (!projection) {
      return Promise.resolve(emptyResponse);
    }

    // For backward compatibility
    // @ts-ignore
    if (layer.getFeatureInfoAtCoordinate) {
      return (
        layer
          // @ts-ignore
          .getFeatureInfoAtCoordinate(coordinate)
      );
    }

    // WMS sources
    // Here we don't use instanceof, to be able to use this function if a layer comes from 2 different ol versions.
    const source = (layer as Layer<TileWMS | ImageWMS>)?.getSource();
    // @ts-ignore
    if (source?.getFeatureInfoUrl) {
      const id = getUid(this);

      // Abort and recreates one controller per layer
      abortControllers[id]?.abort();
      abortControllers[id] = new AbortController();

      const resolution = map?.getView()?.getResolution();
      return getFeaturesFromWMS(
        source,
        {
          coordinate,
          resolution,
          projection,
          params: {
            info_format: 'application/json',
            query_layers: source.getParams().layers,
          },
        },
        abortControllers[id] as AbortController,
      )
        .then((features) => {
          return {
            features,
            layer,
            coordinate,
          };
        })
        .catch(() => {
          return {
            features: [],
            layer,
            coordinate,
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
      layerFilter: (l) => l === layer,
      hitTolerance:
        // @ts-ignore
        layer.get('hitTolerance') || hitTolerance || 5,
    }) as Feature[];

    return Promise.resolve({
      features,
      layer,
      coordinate,
    });
  });
  return Promise.all(promises);
};

export default getFeatureInfoAtCoordinate;
