import { StyleSpecification } from 'maplibre-gl';

export type StyleMetadataGraphs = Record<number, string>;
export type MapsStyleSpecification = {
  metadata?: {
    graphs?: StyleMetadataGraphs;
  };
} & StyleSpecification;
