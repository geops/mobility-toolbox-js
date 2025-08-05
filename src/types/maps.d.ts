import { StyleSpecification } from 'maplibre-gl';

export type MapsStyleSpecification = StyleSpecification & {
  metadata?: {
    graphs?: MapsMetadataGraphs;
  };
};

export type MapsMetadataGraphs = Record<number, string>;
