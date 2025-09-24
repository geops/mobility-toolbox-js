/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Date with time (isoformat) */
  DateTime: { input: any; output: any; }
  GeoJSONDict: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf). */
  JSON: { input: any; output: any; }
  /** Time (isoformat) */
  Time: { input: any; output: any; }
  UUID: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

export type AffectedTimeIntervalInput = {
  dailyEndTime?: InputMaybe<Scalars['Time']['input']>;
  dailyStartTime?: InputMaybe<Scalars['Time']['input']>;
  endTime: Scalars['DateTime']['input'];
  startTime: Scalars['DateTime']['input'];
};

export type AffectedTimeIntervalType = {
  __typename?: 'AffectedTimeIntervalType';
  dailyEndTime?: Maybe<Scalars['Time']['output']>;
  dailyStartTime?: Maybe<Scalars['Time']['output']>;
  endTime: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  startTime: Scalars['DateTime']['output'];
};

export type AssetType = {
  __typename?: 'AssetType';
  absoluteUrl: Scalars['String']['output'];
  label: Scalars['String']['output'];
  uuid: Scalars['UUID']['output'];
};

export type CreateSituationInput = {
  affectedTimeIntervals: Array<AffectedTimeIntervalInput>;
  publicationWindows: Array<PublicationWindowInput>;
  publications: Array<PublicationInput>;
  reasons: Array<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSituationPayload = OperationInfo | SituationType;

export type DeleteSituationInput = {
  id: Scalars['ID']['input'];
};

export type DeleteSituationPayload = OperationInfo | SuccessType;

export type Feature = {
  __typename?: 'Feature';
  geometry: Scalars['GeoJSONDict']['output'];
  properties: MultiRoutingProperties;
  type: Scalars['String']['output'];
};

export type ImageUploadInput = {
  file?: InputMaybe<Scalars['Upload']['input']>;
  label: Scalars['String']['input'];
};

export type IndexedImageInput = {
  imageUuid: Scalars['String']['input'];
};

export type IndexedImageType = {
  __typename?: 'IndexedImageType';
  image: AssetType;
  index: Scalars['Int']['output'];
};

export type InfoLinkInput = {
  label?: InputMaybe<MultiLingualLabelInput>;
  uri: Scalars['String']['input'];
};

export type InfoLinkType = {
  __typename?: 'InfoLinkType';
  id: Scalars['ID']['output'];
  index: Scalars['Int']['output'];
  label?: Maybe<MultiLingualLabelType>;
  uri: Scalars['String']['output'];
};

export type LineGraphGeometryType = {
  __typename?: 'LineGraphGeometryType';
  geom: Scalars['GeoJSONDict']['output'];
  graph: Scalars['String']['output'];
};


export type LineGraphGeometryTypeGeomArgs = {
  precision?: Scalars['Int']['input'];
  simplify?: Scalars['Int']['input'];
};

export type LineGroupInput = {
  category?: InputMaybe<PublicationLineStyleCategoryChoices>;
  hasIcon: Scalars['Boolean']['input'];
  lines?: Array<LineInput>;
  mot?: InputMaybe<MotChoices>;
};

export type LineInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  operatorRef?: Scalars['String']['input'];
  viaStops: Array<StopInput>;
};

export type LineProbability = {
  __typename?: 'LineProbability';
  name: Scalars['String']['output'];
  prob: Scalars['Float']['output'];
};

export type LineType = {
  __typename?: 'LineType';
  geometry: Array<LineGraphGeometryType>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  operatorRef: Scalars['String']['output'];
  viaStops: Array<StopType>;
};


export type LineTypeGeometryArgs = {
  filters?: InputMaybe<PublicationLineGeomFilter>;
};

export enum MotChoices {
  Bus = 'BUS',
  Cablecar = 'CABLECAR',
  Coach = 'COACH',
  Ferry = 'FERRY',
  Funicular = 'FUNICULAR',
  Gondola = 'GONDOLA',
  Rail = 'RAIL',
  Subway = 'SUBWAY',
  Tram = 'TRAM'
}

export type MultiLingualLabelInput = {
  de?: InputMaybe<Scalars['String']['input']>;
  en?: InputMaybe<Scalars['String']['input']>;
  fr?: InputMaybe<Scalars['String']['input']>;
  it?: InputMaybe<Scalars['String']['input']>;
};

export type MultiLingualLabelType = {
  __typename?: 'MultiLingualLabelType';
  de?: Maybe<Scalars['String']['output']>;
  en?: Maybe<Scalars['String']['output']>;
  fr?: Maybe<Scalars['String']['output']>;
  it?: Maybe<Scalars['String']['output']>;
};

export type MultiRoutingParamsType = {
  beelineFallback?: Scalars['Boolean']['input'];
  coordPunish?: Scalars['Float']['input'];
  coordRadius?: Scalars['Float']['input'];
  elevation?: Scalars['Boolean']['input'];
  floorInfo: Scalars['String']['input'];
  graph: Array<Scalars['String']['input']>;
  hops?: Scalars['Boolean']['input'];
  line: Array<Scalars['String']['input']>;
  maxSkipHopRatio?: Scalars['Int']['input'];
  mot: MotChoices;
  resolveHops?: Scalars['Boolean']['input'];
  via: Array<Scalars['String']['input']>;
};

export type MultiRoutingProperties = {
  __typename?: 'MultiRoutingProperties';
  beeline: Scalars['Boolean']['output'];
  graph: Scalars['String']['output'];
  line?: Maybe<Scalars['String']['output']>;
  lineProbabilities: Array<LineProbability>;
  nodeFrom: NodeProperties;
  nodeTo: NodeProperties;
  stationFrom: StationProperties;
  stationTo: StationProperties;
};

export type MultiRoutingResult = {
  __typename?: 'MultiRoutingResult';
  features: Array<Feature>;
  type: Scalars['String']['output'];
};

export type MultilingualTextualContentInput = {
  de?: InputMaybe<TextualContentInput>;
  en?: InputMaybe<TextualContentInput>;
  fr?: InputMaybe<TextualContentInput>;
  images: Array<IndexedImageInput>;
  infoLinks: Array<InfoLinkInput>;
  it?: InputMaybe<TextualContentInput>;
};

export type MultilingualTextualContentType = {
  __typename?: 'MultilingualTextualContentType';
  de?: Maybe<TextualContentType>;
  en?: Maybe<TextualContentType>;
  fr?: Maybe<TextualContentType>;
  id: Scalars['ID']['output'];
  images: Array<IndexedImageType>;
  infoLinks: Array<InfoLinkType>;
  it?: Maybe<TextualContentType>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createSituation: CreateSituationPayload;
  deleteSituation: DeleteSituationPayload;
  updateSituation: UpdateSituationPayload;
  uploadImage: UploadImagePayload;
};


export type MutationCreateSituationArgs = {
  data: CreateSituationInput;
  tenant: Scalars['String']['input'];
};


export type MutationDeleteSituationArgs = {
  data: DeleteSituationInput;
};


export type MutationUpdateSituationArgs = {
  data: UpdateSituationInput;
};


export type MutationUploadImageArgs = {
  data: ImageUploadInput;
};

export type NodeProperties = {
  __typename?: 'NodeProperties';
  edgeFraction: Scalars['Float']['output'];
  externalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isVia: Scalars['Boolean']['output'];
  viaIndex?: Maybe<Scalars['Int']['output']>;
};

export type OffsetPaginationInfo = {
  __typename?: 'OffsetPaginationInfo';
  limit?: Maybe<Scalars['Int']['output']>;
  offset: Scalars['Int']['output'];
};

export type OffsetPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: Scalars['Int']['input'];
};

export type OperationInfo = {
  __typename?: 'OperationInfo';
  /** List of messages returned by the operation. */
  messages: Array<OperationMessage>;
};

export type OperationMessage = {
  __typename?: 'OperationMessage';
  /** The error code, or `null` if no error code was set. */
  code?: Maybe<Scalars['String']['output']>;
  /** The field that caused the error, or `null` if it isn't associated with any particular field. */
  field?: Maybe<Scalars['String']['output']>;
  /** The kind of this message. */
  kind: OperationMessageKind;
  /** The error message. */
  message: Scalars['String']['output'];
};

export enum OperationMessageKind {
  Error = 'ERROR',
  Info = 'INFO',
  Permission = 'PERMISSION',
  Validation = 'VALIDATION',
  Warning = 'WARNING'
}

export enum Ordering {
  Asc = 'ASC',
  AscNullsFirst = 'ASC_NULLS_FIRST',
  AscNullsLast = 'ASC_NULLS_LAST',
  Desc = 'DESC',
  DescNullsFirst = 'DESC_NULLS_FIRST',
  DescNullsLast = 'DESC_NULLS_LAST'
}

export type PaginationMeta = {
  __typename?: 'PaginationMeta';
  nextPage?: Maybe<OffsetPaginationInfo>;
  pageCount: Scalars['Int']['output'];
  pageCurrent: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  previousPage?: Maybe<OffsetPaginationInfo>;
};

export type PlatformType = {
  __typename?: 'PlatformType';
  mot: MotChoices;
  platforms: Array<Scalars['String']['output']>;
};

export type PublicationInput = {
  perspectives: Array<Scalars['String']['input']>;
  publicationLines: Array<LineGroupInput>;
  publicationStops: Array<StopInput>;
  publicationWindows: Array<PublicationWindowInput>;
  serviceCondition?: ServiceConditionEnumeration;
  severity?: SeverityEnumeration;
  textualContentLarge?: InputMaybe<MultilingualTextualContentInput>;
  textualContentMedium?: InputMaybe<MultilingualTextualContentInput>;
  textualContentSmall?: InputMaybe<MultilingualTextualContentInput>;
};

export type PublicationLineGeomFilter = {
  AND?: InputMaybe<PublicationLineGeomFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<PublicationLineGeomFilter>;
  OR?: InputMaybe<PublicationLineGeomFilter>;
  graph?: InputMaybe<Scalars['String']['input']>;
};

export type PublicationLineGroupType = {
  __typename?: 'PublicationLineGroupType';
  category: PublicationLineStyleCategoryChoices;
  hasIcon: Scalars['Boolean']['output'];
  lines: Array<LineType>;
  mot?: Maybe<MotChoices>;
};

export enum PublicationLineStyleCategoryChoices {
  Construction = 'CONSTRUCTION',
  Disruption = 'DISRUPTION',
  IndustrialAction = 'INDUSTRIAL_ACTION',
  LiftFailure = 'LIFT_FAILURE',
  Other = 'OTHER',
  RailReplacement = 'RAIL_REPLACEMENT',
  SpecialEvent = 'SPECIAL_EVENT',
  VehicleFaulure = 'VEHICLE_FAULURE',
  Warning = 'WARNING'
}

export type PublicationStopGeomFilter = {
  AND?: InputMaybe<PublicationStopGeomFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<PublicationStopGeomFilter>;
  OR?: InputMaybe<PublicationStopGeomFilter>;
  graph?: InputMaybe<Scalars['String']['input']>;
};

export type PublicationStopType = {
  __typename?: 'PublicationStopType';
  geometry: Array<StopGraphGeometryType>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  stop: StopType;
  uid: Scalars['String']['output'];
};


export type PublicationStopTypeGeometryArgs = {
  filters?: InputMaybe<PublicationStopGeomFilter>;
};

export type PublicationType = {
  __typename?: 'PublicationType';
  id: Scalars['ID']['output'];
  perspectives: Array<Scalars['String']['output']>;
  publicationLines: Array<PublicationLineGroupType>;
  publicationStops: Array<PublicationStopType>;
  publicationWindows: Array<PublicationWindowType>;
  serviceCondition: ServiceConditionEnumeration;
  serviceConditionGroup: ServiceConditionGroupEnumeration;
  severity: SeverityEnumeration;
  severityGroup: SeverityGroupEnumeration;
  textualContentLarge?: Maybe<MultilingualTextualContentType>;
  textualContentMedium?: Maybe<MultilingualTextualContentType>;
  textualContentSmall?: Maybe<MultilingualTextualContentType>;
};

export type PublicationWindowInput = {
  endTime: Scalars['DateTime']['input'];
  startTime: Scalars['DateTime']['input'];
};

export type PublicationWindowType = {
  __typename?: 'PublicationWindowType';
  endTime: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  startTime: Scalars['DateTime']['output'];
};

export type Query = {
  __typename?: 'Query';
  currentUser: UserType;
  multiRouting: MultiRoutingResult;
  paginatedSituations: SituationTypeExtendedOffsetPaginated;
  previewSituation: SituationType;
  reasons: Array<ReasonType>;
  situation: SituationType;
  sources: Array<SourceType>;
  stop: StopType;
  stops: Array<StopResult>;
};


export type QueryMultiRoutingArgs = {
  params: MultiRoutingParamsType;
};


export type QueryPaginatedSituationsArgs = {
  filters?: InputMaybe<SituationFilter>;
  order?: InputMaybe<SituationOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
  tenant: Scalars['String']['input'];
};


export type QueryPreviewSituationArgs = {
  data: CreateSituationInput;
  tenant: Scalars['String']['input'];
};


export type QueryReasonsArgs = {
  filters?: InputMaybe<ReasonFilter>;
};


export type QuerySituationArgs = {
  pk: Scalars['ID']['input'];
  tenant: Scalars['String']['input'];
};


export type QuerySourcesArgs = {
  filters?: InputMaybe<SourceFilter>;
};


export type QueryStopArgs = {
  id: Scalars['ID']['input'];
  tenant: Scalars['String']['input'];
};


export type QueryStopsArgs = {
  limit?: Scalars['Int']['input'];
  mots: Array<MotChoices>;
  query: Scalars['String']['input'];
  tenant: Scalars['String']['input'];
};

export type ReasonFilter = {
  AND?: InputMaybe<ReasonFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<ReasonFilter>;
  OR?: InputMaybe<ReasonFilter>;
  categoryName?: InputMaybe<Scalars['String']['input']>;
  includeInDropdown?: InputMaybe<Scalars['Boolean']['input']>;
  tenant?: InputMaybe<Scalars['String']['input']>;
};

export type ReasonType = {
  __typename?: 'ReasonType';
  categoryName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  tenant: Scalars['String']['output'];
};

export enum ServiceConditionEnumeration {
  AdditionalRide = 'ADDITIONAL_RIDE',
  AdditionalStop = 'ADDITIONAL_STOP',
  Boarding = 'BOARDING',
  ChangeOfPlatform = 'CHANGE_OF_PLATFORM',
  Delay = 'DELAY',
  DiscontinuedOperation = 'DISCONTINUED_OPERATION',
  Disruption = 'DISRUPTION',
  DisturbanceRectified = 'DISTURBANCE_RECTIFIED',
  Diverted = 'DIVERTED',
  GoToGate = 'GO_TO_GATE',
  IrregularTraffic = 'IRREGULAR_TRAFFIC',
  LimitedOperation = 'LIMITED_OPERATION',
  LineCancellation = 'LINE_CANCELLATION',
  MajorDelays = 'MAJOR_DELAYS',
  MinorDelays = 'MINOR_DELAYS',
  OnTime = 'ON_TIME',
  OperationTimeExtension = 'OPERATION_TIME_EXTENSION',
  ReplacementRide = 'REPLACEMENT_RIDE',
  StopCancelled = 'STOP_CANCELLED',
  StopMoved = 'STOP_MOVED',
  StopOnDemand = 'STOP_ON_DEMAND',
  SubstitutedStop = 'SUBSTITUTED_STOP',
  TemporarilyNonStopping = 'TEMPORARILY_NON_STOPPING',
  TemporaryStopplace = 'TEMPORARY_STOPPLACE',
  TrainShortened = 'TRAIN_SHORTENED',
  TripCancellation = 'TRIP_CANCELLATION',
  UndefinedStatus = 'UNDEFINED_STATUS',
  Unknown = 'UNKNOWN',
  WagonOrderChanged = 'WAGON_ORDER_CHANGED'
}

export enum ServiceConditionGroupEnumeration {
  Changes = 'CHANGES',
  Disruption = 'DISRUPTION',
  Information = 'INFORMATION'
}

export enum SeverityEnumeration {
  Normal = 'NORMAL',
  NoImpact = 'NO_IMPACT',
  Severe = 'SEVERE',
  Slight = 'SLIGHT',
  Undefined = 'UNDEFINED',
  Unknown = 'UNKNOWN',
  VerySevere = 'VERY_SEVERE',
  VerySlight = 'VERY_SLIGHT'
}

export enum SeverityGroupEnumeration {
  High = 'HIGH',
  Low = 'LOW',
  Normal = 'NORMAL',
  Undefined = 'UNDEFINED'
}

export type SituationFilter = {
  AND?: InputMaybe<SituationFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<SituationFilter>;
  OR?: InputMaybe<SituationFilter>;
  affectedAfter?: InputMaybe<Scalars['DateTime']['input']>;
  affectedAt?: InputMaybe<Scalars['DateTime']['input']>;
  affectedBefore?: InputMaybe<Scalars['DateTime']['input']>;
  editedAt?: InputMaybe<Scalars['DateTime']['input']>;
  hasGeoms?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isEdited?: InputMaybe<Scalars['Boolean']['input']>;
  publicAfter?: InputMaybe<Scalars['DateTime']['input']>;
  publicAt?: InputMaybe<Scalars['DateTime']['input']>;
  publicBefore?: InputMaybe<Scalars['DateTime']['input']>;
  reasons?: InputMaybe<Array<Scalars['String']['input']>>;
  sources?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type SituationOrder = {
  endDate?: InputMaybe<Ordering>;
  startDate?: InputMaybe<Ordering>;
  title?: InputMaybe<Ordering>;
};

export type SituationPublicationWindowType = {
  __typename?: 'SituationPublicationWindowType';
  endTime: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  startTime: Scalars['DateTime']['output'];
};

export type SituationType = {
  __typename?: 'SituationType';
  affectedTimeIntervals: Array<AffectedTimeIntervalType>;
  affectedTimeIntervalsEnd?: Maybe<Scalars['DateTime']['output']>;
  affectedTimeIntervalsStart?: Maybe<Scalars['DateTime']['output']>;
  description: Scalars['String']['output'];
  editedAt?: Maybe<Scalars['DateTime']['output']>;
  editedBy?: Maybe<UserType>;
  id: Scalars['ID']['output'];
  language: Scalars['String']['output'];
  publicationLineNames: Array<Scalars['String']['output']>;
  publicationStopNames: Array<Scalars['String']['output']>;
  publicationWindows: Array<SituationPublicationWindowType>;
  publicationWindowsEnd?: Maybe<Scalars['DateTime']['output']>;
  publicationWindowsStart?: Maybe<Scalars['DateTime']['output']>;
  publications: Array<PublicationType>;
  reasons: Array<ReasonType>;
  source?: Maybe<SourceType>;
  tenantSlug: Scalars['String']['output'];
  title: Scalars['String']['output'];
};


export type SituationTypeReasonsArgs = {
  filters?: InputMaybe<ReasonFilter>;
};

export type SituationTypeExtendedOffsetPaginated = {
  __typename?: 'SituationTypeExtendedOffsetPaginated';
  meta: PaginationMeta;
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<SituationType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type SourceFilter = {
  AND?: InputMaybe<SourceFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<SourceFilter>;
  OR?: InputMaybe<SourceFilter>;
  tenant?: InputMaybe<Scalars['String']['input']>;
};

export type SourceType = {
  __typename?: 'SourceType';
  name: Scalars['String']['output'];
  tenant: Scalars['String']['output'];
};

export type StationProperties = {
  __typename?: 'StationProperties';
  id: Scalars['String']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  routedId: Scalars['String']['output'];
};

export type StopGraphGeometryType = {
  __typename?: 'StopGraphGeometryType';
  geom: Scalars['GeoJSONDict']['output'];
  graph: Scalars['String']['output'];
};


export type StopGraphGeometryTypeGeomArgs = {
  precision?: Scalars['Int']['input'];
  simplify?: Scalars['Int']['input'];
};

export type StopInput = {
  id: Scalars['ID']['input'];
};

export type StopResult = {
  __typename?: 'StopResult';
  code?: Maybe<Scalars['String']['output']>;
  countryCode?: Maybe<Scalars['String']['output']>;
  externalId?: Maybe<Scalars['String']['output']>;
  identSource?: Maybe<Scalars['String']['output']>;
  ifopt?: Maybe<Scalars['String']['output']>;
  matchedName?: Maybe<Scalars['String']['output']>;
  mot: Array<MotChoices>;
  municipalityName?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  platforms: Array<PlatformType>;
  rank: Scalars['Float']['output'];
  stop: StopType;
  translatedNames: Array<Scalars['String']['output']>;
  uid: Scalars['String']['output'];
};

export type StopType = {
  __typename?: 'StopType';
  geom: Scalars['GeoJSONDict']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  uid: Scalars['String']['output'];
};

export type SuccessType = {
  __typename?: 'SuccessType';
  ok: Scalars['Boolean']['output'];
};

export type TextualContentInput = {
  consequence?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  durationText?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  recommendation?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  summary: Scalars['String']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type TextualContentType = {
  __typename?: 'TextualContentType';
  consequence?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  durationText?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  recommendation?: Maybe<Scalars['String']['output']>;
  remark?: Maybe<Scalars['String']['output']>;
  summary: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

export type UpdateSituationInput = {
  affectedTimeIntervals: Array<AffectedTimeIntervalInput>;
  id: Scalars['ID']['input'];
  publicationWindows: Array<PublicationWindowInput>;
  publications: Array<PublicationInput>;
  reasons: Array<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSituationPayload = OperationInfo | SituationType;

export type UploadImagePayload = AssetType | OperationInfo;

export type UserType = {
  __typename?: 'UserType';
  configs: Scalars['JSON']['output'];
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
  username: Scalars['String']['output'];
};
