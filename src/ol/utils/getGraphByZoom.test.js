import getGraphByZoom from './getGraphByZoom';

describe('getGraphByZoom', () => {
  it('should return osm', () => {
    let graph = getGraphByZoom(null);
    expect(graph).toBe('osm');
    graph = getGraphByZoom(undefined);
    expect(graph).toBe('osm');
    graph = getGraphByZoom('0');
    expect(graph).toBe('osm');
    graph = getGraphByZoom(0);
    expect(graph).toBe('osm');
    graph = getGraphByZoom(0, {});
    expect(graph).toBe('osm');
  });

  it('should the correct graph', () => {
    const metadata = {
      4: 'topo4', // ol zoom 5
      5: 'topo5', // ol zoom 6
      8: 'osmplus', // ol zoom 9
    };
    let graph = getGraphByZoom(2, metadata);
    expect(graph).toBe('topo4');

    graph = getGraphByZoom(4.99, metadata);
    expect(graph).toBe('topo4');
    graph = getGraphByZoom(5, metadata);
    expect(graph).toBe('topo4');
    graph = getGraphByZoom(5.1, metadata);
    expect(graph).toBe('topo4');

    graph = getGraphByZoom(5.99, metadata);
    expect(graph).toBe('topo4');
    graph = getGraphByZoom(6, metadata);
    expect(graph).toBe('topo5');
    graph = getGraphByZoom(6.1, metadata);
    expect(graph).toBe('topo5');

    graph = getGraphByZoom(8.99, metadata);
    expect(graph).toBe('topo5');
    graph = getGraphByZoom(9, metadata);
    expect(graph).toBe('osmplus');
    graph = getGraphByZoom(9.1, metadata);
    expect(graph).toBe('osmplus');
    graph = getGraphByZoom(22, metadata);
    expect(graph).toBe('osmplus');
  });
});
