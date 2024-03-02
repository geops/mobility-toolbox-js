// TODO: I use any to avoid circular dependency  with common/layers/layer
/** @private */
const getLayersAsFlatArray = (layersOrLayer: any | any[]): any[] => {
  let layers = layersOrLayer;
  if (!Array.isArray(layers)) {
    layers = [layersOrLayer as any];
  }
  let flatLayers: any[] = [];
  layers.forEach((layer: any) => {
    flatLayers.push(layer);
    // Handle children property and ol.layer.Group
    const children =
      layer.children ||
      layer.get('children') ||
      layer.getLayers?.()?.getArray();
    flatLayers = flatLayers.concat(getLayersAsFlatArray(children || []));
  });
  return flatLayers;
};

export default getLayersAsFlatArray;
