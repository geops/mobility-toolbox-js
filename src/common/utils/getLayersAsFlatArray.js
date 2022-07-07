const getLayersAsFlatArray = (layersOrLayer) => {
  let layers = layersOrLayer;
  if (!Array.isArray(layers)) {
    layers = [layersOrLayer];
  }
  let flatLayers = [];
  layers.forEach((layer) => {
    flatLayers.push(layer);
    const { children } = layer;
    flatLayers = flatLayers.concat(getLayersAsFlatArray(children || []));
  });
  return flatLayers;
};

export default getLayersAsFlatArray;
