import type { Coordinate } from 'ol/coordinate';
import type { Layer } from 'ol/layer';
import { Feature, Map } from 'ol';
import { ImageWMS, TileWMS } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import BaseLayer from 'ol/layer/Base';
import { LayerGetFeatureInfoResponse } from '../../types';

const format = new GeoJSON();

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

const getFeatureInfoAtCoordinate = (
  coordinate: Coordinate,
  layers: (BaseLayer | { getFeatureInfoAtCoordinate: () => void })[],
  map: Map,
  abortController: AbortController,
  hitTolerance: number,
) => {
  const pixel = map?.getPixelFromCoordinate(coordinate);
  const projection = map?.getView()?.getProjection();
  const resolution = map?.getView()?.getResolution();

  const promises = layers.map((layer) => {
    // For backward compatibility
    // @ts-ignore
    if (layer.getFeatureInfoAtCoordinate) {
      return (
        layer
          // @ts-ignore
          .getFeatureInfoAtCoordinate(coordinate)
      );
    }
    // Here we don't use instanceof, to be able to use this function if a layer comes from 2 different ol versions.
    const source = (layer as Layer<TileWMS | ImageWMS>).getSource();
    // @ts-ignore
    if (source?.getFeatureInfoUrl) {
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
        abortController,
      ).then((features) => {
        return {
          features,
          layer,
          coordinate,
        };
      });
    }

    // For last resort we try the map function to get the features from the map
    const features = map.getFeaturesAtPixel(pixel, {
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
