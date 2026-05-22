import getGraphByZoomFromStyleMetadata from './getGraphByZoomFromStyleMetadata';

describe('getGraphByZoomFromStyleMetadata', () => {
  it('should return osm', () => {
    let graph = getGraphByZoomFromStyleMetadata(null);
    expect(graph).toBe('osm');
    graph = getGraphByZoomFromStyleMetadata(undefined);
    expect(graph).toBe('osm');
    graph = getGraphByZoomFromStyleMetadata('0');
    expect(graph).toBe('osm');
    graph = getGraphByZoomFromStyleMetadata(0);
    expect(graph).toBe('osm');
    graph = getGraphByZoomFromStyleMetadata(0, {});
    expect(graph).toBe('osm');
  });

  it('should the correct graph', () => {
    const metadata = {
      4: 'topo4', // ol zoom 5
      5: 'topo5', // ol zoom 6
      8: 'osmplus', // ol zoom 9
    };
    let graph = getGraphByZoomFromStyleMetadata(2, metadata);
    expect(graph).toBe('topo4');

    graph = getGraphByZoomFromStyleMetadata(4.99, metadata);
    expect(graph).toBe('topo4');
    graph = getGraphByZoomFromStyleMetadata(5, metadata);
    expect(graph).toBe('topo4');
    graph = getGraphByZoomFromStyleMetadata(5.1, metadata);
    expect(graph).toBe('topo4');

    graph = getGraphByZoomFromStyleMetadata(5.99, metadata);
    expect(graph).toBe('topo4');
    graph = getGraphByZoomFromStyleMetadata(6, metadata);
    expect(graph).toBe('topo5');
    graph = getGraphByZoomFromStyleMetadata(6.1, metadata);
    expect(graph).toBe('topo5');

    graph = getGraphByZoomFromStyleMetadata(8.99, metadata);
    expect(graph).toBe('topo5');
    graph = getGraphByZoomFromStyleMetadata(9, metadata);
    expect(graph).toBe('osmplus');
    graph = getGraphByZoomFromStyleMetadata(9.1, metadata);
    expect(graph).toBe('osmplus');
    graph = getGraphByZoomFromStyleMetadata(22, metadata);
    expect(graph).toBe('osmplus');
  });
});
