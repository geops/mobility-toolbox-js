const getGraphByZoom = (zoom: number, graphsByZoom: string[] = ["osm"]) => {
  if (zoom > graphsByZoom.length - 1) {
    return graphsByZoom?.[graphsByZoom.length - 1];
  }
  return graphsByZoom?.[zoom];
};

export default getGraphByZoom;
