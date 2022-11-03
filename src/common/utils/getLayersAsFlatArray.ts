// TODO: I use any to avoid circular dependency  with common/layers/layer
const getLayersAsFlatArray = (layersOrLayer: any | any[]): any[] => {
  let layers = layersOrLayer;
  if (!Array.isArray(layers)) {
    layers = [layersOrLayer as any];
  }
  let flatLayers: any[] = [];
  layers.forEach((layer: any) => {
    flatLayers.push(layer);
    const { children } = layer;
    flatLayers = flatLayers.concat(getLayersAsFlatArray(children || []));
  });
  return flatLayers;
};

export default getLayersAsFlatArray;
