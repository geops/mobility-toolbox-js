import type BaseLayer from 'ol/layer/Base';
import type LayerGroup from 'ol/layer/Group';

const getLayersAsFlatArray = (
  layersOrLayer: BaseLayer | BaseLayer[],
): BaseLayer[] => {
  let layers = layersOrLayer;
  if (!Array.isArray(layers)) {
    layers = [layersOrLayer as BaseLayer];
  }
  let flatLayers: BaseLayer[] = [];
  layers.forEach((layer: BaseLayer) => {
    flatLayers.push(layer);
    // Handle children property and ol.layer.Group
    const children =
      // @ts-expect-error children is deprecated
      (layer.children as BaseLayer[]) ||
      (layer.get('children') as BaseLayer[]) ||
      (layer as LayerGroup).getLayers?.()?.getArray();
    flatLayers = flatLayers.concat(getLayersAsFlatArray(children || []));
  });
  return flatLayers;
};

export default getLayersAsFlatArray;
