interface FullTrajectoryCollectionProperties {
  additionalProperties?: Map<string, any>;
  gen_level?: null | number;
  gen_range: number[];
  graph?: null | string;
  license?: null | string;
  licenseNote?: null | string;
  licenseUrl?: null | string;
  operator?: null | string;
  operatorUrl?: null | string;
  publisher?: null | string;
  publisherUrl?: null | string;
  tenant?: string;
  train_id: string;
}
export default FullTrajectoryCollectionProperties;
