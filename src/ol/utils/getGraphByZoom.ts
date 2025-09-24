import type { StyleMetadataGraphs } from '../../types';

export const DEFAULT_GRAPH = 'osm';

export const DEFAULT_GRAPH_MAPPING: StyleMetadataGraphs = {
  1: DEFAULT_GRAPH,
};

/**
 * This function return which graph to use based on the current zoom level.
 *
 * The list of graphs available for a maplibre style is available in the style metadata.
 *
 * @param {number} zoom - The current zoom level of the map.
 * @param {StyleMetadataGraphs} styleMetadata - The style metadata containing the graph mapping.
 * @returns {string} - The graph to use for the given zoom level.
 */
export default function getGraphByZoom(
  zoom = 0,
  styleMetadata: StyleMetadataGraphs = DEFAULT_GRAPH_MAPPING,
): string {
  const breakPoints: number[] = Object.keys(styleMetadata).map((k) => {
    return parseFloat(k);
  });
  const closest = breakPoints.reverse().find((bp) => {
    return bp <= Math.floor(zoom) - 1; // - 1 due to ol zoom !== mapbox zoom
  });
  let key: number | undefined = closest;
  key ??= Math.min(...breakPoints);

  return styleMetadata[key] ?? DEFAULT_GRAPH;
}
