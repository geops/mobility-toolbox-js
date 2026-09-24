/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | {
      [P in keyof T]?: P extends "__typename" | " $fragmentName" ? T[P] : never;
    }
  | T;
export type Maybe<T> = null | T;
export type InputMaybe<T> = Maybe<T>;
export type JsonValue =
  boolean | JsonArray | JsonObject | null | number | string;
export interface JsonArray extends Array<JsonValue> {}
export interface JsonObject {
  [key: string]: JsonValue;
}
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  Boolean: { input: boolean; output: boolean };
  /** Date with time (isoformat) */
  DateTime: { input: string; output: string };
  Float: { input: number; output: number };
  /** Geometry object as descibed in RFC 7946 section 3.1 with SRID=3857. */
  GeoJSONDict: { input: GeoJSON.Geometry; output: GeoJSON.Geometry };
  ID: { input: string; output: string };
  Int: { input: number; output: number };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf). */
  JSON: { input: JsonObject; output: JsonObject };
  String: { input: string; output: string };
  /** Time (isoformat) */
  Time: { input: string; output: string };
  /** Represents a file upload. */
  Upload: { input: unknown; output: unknown };
  UUID: { input: string; output: string };
}

export interface AffectedTimeIntervalInput {
  dailyEndTime?: InputMaybe<Scalars["Time"]["input"]>;
  dailyStartTime?: InputMaybe<Scalars["Time"]["input"]>;
  endTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  startTime?: InputMaybe<Scalars["DateTime"]["input"]>;
}

export interface AffectedTimeIntervalType {
  __typename?: "AffectedTimeIntervalType";
  dailyEndTime?: Maybe<Scalars["Time"]["output"]>;
  dailyStartTime?: Maybe<Scalars["Time"]["output"]>;
  endTime?: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["ID"]["output"];
  startTime?: Maybe<Scalars["DateTime"]["output"]>;
}

export interface AssetType {
  __typename?: "AssetType";
  absoluteUrl: Scalars["String"]["output"];
  label: Scalars["String"]["output"];
  uuid: Scalars["UUID"]["output"];
}

export interface BboxFilterInput {
  bbox?: InputMaybe<Scalars["Float"]["input"][]>;
  graph?: Scalars["String"]["input"];
  srid?: Scalars["Int"]["input"];
}

export interface CreateSituationInput {
  affectedTimeIntervals: AffectedTimeIntervalInput[];
  isActive?: Scalars["Boolean"]["input"];
  publications: PublicationInput[];
  publicationWindows: PublicationWindowInput[];
  reasons: Scalars["String"]["input"][];
  title?: InputMaybe<Scalars["String"]["input"]>;
}

export type CreateSituationPayload = OperationInfo | SituationType;

export interface DeleteSituationInput {
  id: Scalars["ID"]["input"];
}

export type DeleteSituationPayload = OperationInfo | SuccessType;

export interface Feature {
  __typename?: "Feature";
  geometry: Scalars["GeoJSONDict"]["output"];
  properties: MultiRoutingProperties;
  type: Scalars["String"]["output"];
}

export interface ImageUploadInput {
  file?: InputMaybe<Scalars["Upload"]["input"]>;
  label: Scalars["String"]["input"];
}

export interface IndexedImageInput {
  imageUuid: Scalars["String"]["input"];
}

export interface IndexedImageType {
  __typename?: "IndexedImageType";
  image: AssetType;
  index: Scalars["Int"]["output"];
}

export interface InfoLinkInput {
  label?: InputMaybe<MultiLingualLabelInput>;
  uri: Scalars["String"]["input"];
}

export interface InfoLinkType {
  __typename?: "InfoLinkType";
  id: Scalars["ID"]["output"];
  index: Scalars["Int"]["output"];
  label?: Maybe<MultiLingualLabelType>;
  uri: Scalars["String"]["output"];
}

export interface LineGraphGeometryType {
  __typename?: "LineGraphGeometryType";
  geom: Scalars["GeoJSONDict"]["output"];
  graph: Scalars["String"]["output"];
}

export interface LineGraphGeometryTypeGeomArgs {
  precision?: Scalars["Int"]["input"];
  simplify?: Scalars["Int"]["input"];
}

export interface LineGroupInput {
  category?: InputMaybe<PublicationLineStyleCategoryChoices>;
  hasIcon: Scalars["Boolean"]["input"];
  lines?: LineInput[];
  mot?: InputMaybe<MotChoices>;
}

export interface LineInput {
  id?: InputMaybe<Scalars["ID"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  operatorRef?: Scalars["String"]["input"];
  viaStops: StopInput[];
}

export interface LineProbability {
  __typename?: "LineProbability";
  name: Scalars["String"]["output"];
  prob: Scalars["Float"]["output"];
}

export interface LineType {
  __typename?: "LineType";
  geometry: LineGraphGeometryType[];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  operatorRef: Scalars["String"]["output"];
  viaStops: StopType[];
}

export interface LineTypeGeometryArgs {
  filters?: InputMaybe<PublicationLineGeomFilter>;
}

export const MotChoices = {
  Bus: "BUS",
  Cablecar: "CABLECAR",
  Coach: "COACH",
  Ferry: "FERRY",
  Funicular: "FUNICULAR",
  Gondola: "GONDOLA",
  Rail: "RAIL",
  Subway: "SUBWAY",
  Tram: "TRAM",
} as const;

export type MotChoices = (typeof MotChoices)[keyof typeof MotChoices];
export interface MultiLingualLabelInput {
  de?: InputMaybe<Scalars["String"]["input"]>;
  en?: InputMaybe<Scalars["String"]["input"]>;
  fr?: InputMaybe<Scalars["String"]["input"]>;
  it?: InputMaybe<Scalars["String"]["input"]>;
}

export interface MultiLingualLabelType {
  __typename?: "MultiLingualLabelType";
  de?: Maybe<Scalars["String"]["output"]>;
  en?: Maybe<Scalars["String"]["output"]>;
  fr?: Maybe<Scalars["String"]["output"]>;
  it?: Maybe<Scalars["String"]["output"]>;
}

export interface MultiRoutingParamsType {
  beelineFallback?: Scalars["Boolean"]["input"];
  coordPunish?: Scalars["Float"]["input"];
  coordRadius?: Scalars["Float"]["input"];
  elevation?: Scalars["Boolean"]["input"];
  floorInfo: Scalars["String"]["input"];
  graph: Scalars["String"]["input"][];
  hops?: Scalars["Boolean"]["input"];
  line: Scalars["String"]["input"][];
  maxSkipHopRatio?: Scalars["Int"]["input"];
  mot: MotChoices;
  resolveHops?: Scalars["Boolean"]["input"];
  via: Scalars["String"]["input"][];
}

export interface MultiRoutingProperties {
  __typename?: "MultiRoutingProperties";
  beeline: Scalars["Boolean"]["output"];
  graph: Scalars["String"]["output"];
  line?: Maybe<Scalars["String"]["output"]>;
  lineProbabilities: LineProbability[];
  nodeFrom: NodeProperties;
  nodeTo: NodeProperties;
  stationFrom: StationProperties;
  stationTo: StationProperties;
}

export interface MultiRoutingResult {
  __typename?: "MultiRoutingResult";
  features: Feature[];
  type: Scalars["String"]["output"];
}

export interface MultilingualTextualContentFilter {
  AND?: InputMaybe<MultilingualTextualContentFilter>;
  DISTINCT?: InputMaybe<Scalars["Boolean"]["input"]>;
  NOT?: InputMaybe<MultilingualTextualContentFilter>;
  OR?: InputMaybe<MultilingualTextualContentFilter>;
  size?: InputMaybe<Scalars["String"]["input"]>;
}

export interface MultilingualTextualContentInput {
  de?: InputMaybe<TextualContentInput>;
  en?: InputMaybe<TextualContentInput>;
  fr?: InputMaybe<TextualContentInput>;
  it?: InputMaybe<TextualContentInput>;
}

export interface MultilingualTextualContentType {
  __typename?: "MultilingualTextualContentType";
  de?: Maybe<TextualContentType>;
  en?: Maybe<TextualContentType>;
  fr?: Maybe<TextualContentType>;
  id: Scalars["ID"]["output"];
  it?: Maybe<TextualContentType>;
  size: Scalars["String"]["output"];
}

export interface Mutation {
  __typename?: "Mutation";
  createSituation: CreateSituationPayload;
  deleteSituation: DeleteSituationPayload;
  updateSituation: UpdateSituationPayload;
  uploadImage: UploadImagePayload;
}

export interface MutationCreateSituationArgs {
  data: CreateSituationInput;
  tenant: Scalars["String"]["input"];
}

export interface MutationDeleteSituationArgs {
  data: DeleteSituationInput;
}

export interface MutationUpdateSituationArgs {
  data: UpdateSituationInput;
}

export interface MutationUploadImageArgs {
  data: ImageUploadInput;
}

export interface NodeProperties {
  __typename?: "NodeProperties";
  edgeFraction: Scalars["Float"]["output"];
  externalId?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["String"]["output"];
  isVia: Scalars["Boolean"]["output"];
  viaIndex?: Maybe<Scalars["Int"]["output"]>;
}

export interface OffsetPaginationInfo {
  __typename?: "OffsetPaginationInfo";
  limit?: Maybe<Scalars["Int"]["output"]>;
  offset: Scalars["Int"]["output"];
}

export interface OffsetPaginationInput {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: Scalars["Int"]["input"];
}

export interface OperationInfo {
  __typename?: "OperationInfo";
  /** List of messages returned by the operation. */
  messages: OperationMessage[];
}

export interface OperationMessage {
  __typename?: "OperationMessage";
  /** The error code, or `null` if no error code was set. */
  code?: Maybe<Scalars["String"]["output"]>;
  /** The field that caused the error, or `null` if it isn't associated with any particular field. */
  field?: Maybe<Scalars["String"]["output"]>;
  /** The kind of this message. */
  kind: OperationMessageKind;
  /** The error message. */
  message: Scalars["String"]["output"];
}

export const OperationMessageKind = {
  Error: "ERROR",
  Info: "INFO",
  Permission: "PERMISSION",
  Validation: "VALIDATION",
  Warning: "WARNING",
} as const;

export type OperationMessageKind =
  (typeof OperationMessageKind)[keyof typeof OperationMessageKind];
export const Ordering = {
  Asc: "ASC",
  AscNullsFirst: "ASC_NULLS_FIRST",
  AscNullsLast: "ASC_NULLS_LAST",
  Desc: "DESC",
  DescNullsFirst: "DESC_NULLS_FIRST",
  DescNullsLast: "DESC_NULLS_LAST",
} as const;

export type Ordering = (typeof Ordering)[keyof typeof Ordering];
export interface PaginationMeta {
  __typename?: "PaginationMeta";
  nextPage?: Maybe<OffsetPaginationInfo>;
  pageCount: Scalars["Int"]["output"];
  pageCurrent: Scalars["Int"]["output"];
  pageSize: Scalars["Int"]["output"];
  previousPage?: Maybe<OffsetPaginationInfo>;
}

export interface PlatformType {
  __typename?: "PlatformType";
  mot: MotChoices;
  platforms: Scalars["String"]["output"][];
}

export interface PublicationInput {
  images: IndexedImageInput[];
  infoLinks: InfoLinkInput[];
  perspectives: Scalars["String"]["input"][];
  publicationLines: LineGroupInput[];
  publicationStops: StopInput[];
  publicationWindows: PublicationWindowInput[];
  serviceCondition?: ServiceConditionEnumeration;
  severity?: SeverityEnumeration;
  textualContentLarge?: InputMaybe<MultilingualTextualContentInput>;
  textualContentMedium?: InputMaybe<MultilingualTextualContentInput>;
  textualContentSmall?: InputMaybe<MultilingualTextualContentInput>;
}

export interface PublicationLineGeomFilter {
  AND?: InputMaybe<PublicationLineGeomFilter>;
  DISTINCT?: InputMaybe<Scalars["Boolean"]["input"]>;
  graph?: InputMaybe<Scalars["String"]["input"]>;
  NOT?: InputMaybe<PublicationLineGeomFilter>;
  OR?: InputMaybe<PublicationLineGeomFilter>;
}

export interface PublicationLineGroupType {
  __typename?: "PublicationLineGroupType";
  category: PublicationLineStyleCategoryChoices;
  hasIcon: Scalars["Boolean"]["output"];
  lines: LineType[];
  mot?: Maybe<MotChoices>;
}

export const PublicationLineStyleCategoryChoices = {
  Construction: "CONSTRUCTION",
  Disruption: "DISRUPTION",
  IndustrialAction: "INDUSTRIAL_ACTION",
  LiftFailure: "LIFT_FAILURE",
  Other: "OTHER",
  RailReplacement: "RAIL_REPLACEMENT",
  SpecialEvent: "SPECIAL_EVENT",
  VehicleFaulure: "VEHICLE_FAULURE",
  Warning: "WARNING",
} as const;

export type PublicationLineStyleCategoryChoices =
  (typeof PublicationLineStyleCategoryChoices)[keyof typeof PublicationLineStyleCategoryChoices];
export interface PublicationStopGeomFilter {
  AND?: InputMaybe<PublicationStopGeomFilter>;
  DISTINCT?: InputMaybe<Scalars["Boolean"]["input"]>;
  graph?: InputMaybe<Scalars["String"]["input"]>;
  NOT?: InputMaybe<PublicationStopGeomFilter>;
  OR?: InputMaybe<PublicationStopGeomFilter>;
}

export interface PublicationStopType {
  __typename?: "PublicationStopType";
  geometry: StopGraphGeometryType[];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  publishedLineNames: Scalars["String"]["output"][];
  stop: StopType;
  uid: Scalars["String"]["output"];
}

export interface PublicationStopTypeGeometryArgs {
  filters?: InputMaybe<PublicationStopGeomFilter>;
}

export interface PublicationType {
  __typename?: "PublicationType";
  effectivePublicationWindows: TimeIntervalType[];
  id: Scalars["ID"]["output"];
  images: IndexedImageType[];
  infoLinks: InfoLinkType[];
  perspectives: Scalars["String"]["output"][];
  publicationLineNames: Scalars["String"]["output"][];
  publicationLines: PublicationLineGroupType[];
  publicationStops: PublicationStopType[];
  publicationWindows: PublicationWindowType[];
  serviceCondition: ServiceConditionEnumeration;
  serviceConditionGroup: ServiceConditionGroupEnumeration;
  severity: SeverityEnumeration;
  severityGroup: SeverityGroupEnumeration;
  /** @deprecated Use textualContents field instead */
  textualContentLarge?: Maybe<MultilingualTextualContentType>;
  /** @deprecated Use textualContents field instead */
  textualContentMedium?: Maybe<MultilingualTextualContentType>;
  textualContents: MultilingualTextualContentType[];
  /** @deprecated Use textualContents field instead */
  textualContentSmall?: Maybe<MultilingualTextualContentType>;
}

export interface PublicationTypeTextualContentsArgs {
  filters?: InputMaybe<MultilingualTextualContentFilter>;
}

export interface PublicationWindowInput {
  endTime: Scalars["DateTime"]["input"];
  startTime: Scalars["DateTime"]["input"];
}

export interface PublicationWindowType {
  __typename?: "PublicationWindowType";
  endTime: Scalars["DateTime"]["output"];
  id: Scalars["ID"]["output"];
  startTime: Scalars["DateTime"]["output"];
}

export interface Query {
  __typename?: "Query";
  currentUser: UserType;
  multiRouting: MultiRoutingResult;
  paginatedSituations: SituationTypeExtendedOffsetPaginated;
  previewSituation: SituationType;
  reasons: ReasonType[];
  situation: SituationType;
  sources: SourceType[];
  stop: StopType;
  stops: StopResult[];
}

export interface QueryMultiRoutingArgs {
  params: MultiRoutingParamsType;
}

export interface QueryPaginatedSituationsArgs {
  filters?: InputMaybe<SituationFilter>;
  order?: InputMaybe<SituationOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
  tenant: Scalars["String"]["input"];
}

export interface QueryPreviewSituationArgs {
  data: CreateSituationInput;
  tenant: Scalars["String"]["input"];
}

export interface QueryReasonsArgs {
  filters?: InputMaybe<ReasonFilter>;
}

export interface QuerySituationArgs {
  pk: Scalars["ID"]["input"];
  tenant: Scalars["String"]["input"];
}

export interface QuerySourcesArgs {
  filters?: InputMaybe<SourceFilter>;
}

export interface QueryStopArgs {
  id: Scalars["ID"]["input"];
  tenant: Scalars["String"]["input"];
}

export interface QueryStopsArgs {
  limit?: Scalars["Int"]["input"];
  mots: MotChoices[];
  query: Scalars["String"]["input"];
  tenant: Scalars["String"]["input"];
}

export interface ReasonFilter {
  AND?: InputMaybe<ReasonFilter>;
  categoryName?: InputMaybe<Scalars["String"]["input"]>;
  DISTINCT?: InputMaybe<Scalars["Boolean"]["input"]>;
  includeInDropdown?: InputMaybe<Scalars["Boolean"]["input"]>;
  NOT?: InputMaybe<ReasonFilter>;
  OR?: InputMaybe<ReasonFilter>;
  tenant?: InputMaybe<Scalars["String"]["input"]>;
}

export interface ReasonType {
  __typename?: "ReasonType";
  categoryName: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  tenant: Scalars["String"]["output"];
}

export const ServiceConditionEnumeration = {
  AdditionalRide: "ADDITIONAL_RIDE",
  AdditionalStop: "ADDITIONAL_STOP",
  Boarding: "BOARDING",
  ChangeOfPlatform: "CHANGE_OF_PLATFORM",
  Delay: "DELAY",
  DiscontinuedOperation: "DISCONTINUED_OPERATION",
  Disruption: "DISRUPTION",
  DisturbanceRectified: "DISTURBANCE_RECTIFIED",
  Diverted: "DIVERTED",
  GoToGate: "GO_TO_GATE",
  IrregularTraffic: "IRREGULAR_TRAFFIC",
  LimitedOperation: "LIMITED_OPERATION",
  LineCancellation: "LINE_CANCELLATION",
  MajorDelays: "MAJOR_DELAYS",
  MinorDelays: "MINOR_DELAYS",
  OnTime: "ON_TIME",
  OperationTimeExtension: "OPERATION_TIME_EXTENSION",
  ReplacementRide: "REPLACEMENT_RIDE",
  StopCancelled: "STOP_CANCELLED",
  StopMoved: "STOP_MOVED",
  StopOnDemand: "STOP_ON_DEMAND",
  SubstitutedStop: "SUBSTITUTED_STOP",
  TemporarilyNonStopping: "TEMPORARILY_NON_STOPPING",
  TemporaryStopplace: "TEMPORARY_STOPPLACE",
  TrainShortened: "TRAIN_SHORTENED",
  TripCancellation: "TRIP_CANCELLATION",
  UndefinedStatus: "UNDEFINED_STATUS",
  Unknown: "UNKNOWN",
  WagonOrderChanged: "WAGON_ORDER_CHANGED",
} as const;

export type ServiceConditionEnumeration =
  (typeof ServiceConditionEnumeration)[keyof typeof ServiceConditionEnumeration];
export const ServiceConditionGroupEnumeration = {
  Changes: "CHANGES",
  Disruption: "DISRUPTION",
  Information: "INFORMATION",
} as const;

export type ServiceConditionGroupEnumeration =
  (typeof ServiceConditionGroupEnumeration)[keyof typeof ServiceConditionGroupEnumeration];
export const SeverityEnumeration = {
  NoImpact: "NO_IMPACT",
  Normal: "NORMAL",
  Severe: "SEVERE",
  Slight: "SLIGHT",
  Undefined: "UNDEFINED",
  Unknown: "UNKNOWN",
  VerySevere: "VERY_SEVERE",
  VerySlight: "VERY_SLIGHT",
} as const;

export type SeverityEnumeration =
  (typeof SeverityEnumeration)[keyof typeof SeverityEnumeration];
export const SeverityGroupEnumeration = {
  High: "HIGH",
  Low: "LOW",
  Normal: "NORMAL",
  Undefined: "UNDEFINED",
} as const;

export type SeverityGroupEnumeration =
  (typeof SeverityGroupEnumeration)[keyof typeof SeverityGroupEnumeration];
export interface SituationFilter {
  affectedAfter?: InputMaybe<Scalars["DateTime"]["input"]>;
  affectedAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  affectedBefore?: InputMaybe<Scalars["DateTime"]["input"]>;
  AND?: InputMaybe<SituationFilter>;
  bbox?: InputMaybe<BboxFilterInput>;
  DISTINCT?: InputMaybe<Scalars["Boolean"]["input"]>;
  editedAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  hasGeoms?: InputMaybe<Scalars["Boolean"]["input"]>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  isEdited?: InputMaybe<Scalars["Boolean"]["input"]>;
  lineName?: InputMaybe<Scalars["String"]["input"]>;
  NOT?: InputMaybe<SituationFilter>;
  OR?: InputMaybe<SituationFilter>;
  publicAfter?: InputMaybe<Scalars["DateTime"]["input"]>;
  publicAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  publicBefore?: InputMaybe<Scalars["DateTime"]["input"]>;
  publicNow?: InputMaybe<Scalars["Boolean"]["input"]>;
  reasons?: InputMaybe<Scalars["String"]["input"][]>;
  sourceIdent?: InputMaybe<Scalars["String"]["input"]>;
  sources?: InputMaybe<Scalars["String"]["input"][]>;
  stopName?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
}

export interface SituationOrder {
  endDate?: InputMaybe<Ordering>;
  startDate?: InputMaybe<Ordering>;
  title?: InputMaybe<Ordering>;
}

export interface SituationPublicationWindowType {
  __typename?: "SituationPublicationWindowType";
  endTime: Scalars["DateTime"]["output"];
  id: Scalars["ID"]["output"];
  startTime: Scalars["DateTime"]["output"];
}

export interface SituationType {
  __typename?: "SituationType";
  affectedTimeIntervals: AffectedTimeIntervalType[];
  affectedTimeIntervalsEnd?: Maybe<Scalars["DateTime"]["output"]>;
  affectedTimeIntervalsStart?: Maybe<Scalars["DateTime"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  description: Scalars["String"]["output"];
  detailDe: Scalars["String"]["output"];
  detailEn: Scalars["String"]["output"];
  detailFr: Scalars["String"]["output"];
  detailIt: Scalars["String"]["output"];
  editedAt?: Maybe<Scalars["DateTime"]["output"]>;
  editedBy?: Maybe<UserType>;
  id: Scalars["ID"]["output"];
  isActive: Scalars["Boolean"]["output"];
  language: Scalars["String"]["output"];
  publicationLineNames: Scalars["String"]["output"][];
  publications: PublicationType[];
  publicationStopNames: Scalars["String"]["output"][];
  publicationWindows: SituationPublicationWindowType[];
  publicationWindowsEnd: Scalars["DateTime"]["output"];
  publicationWindowsStart: Scalars["DateTime"]["output"];
  reasons: ReasonType[];
  source?: Maybe<SourceType>;
  tenantSlug: Scalars["String"]["output"];
  title: Scalars["String"]["output"];
}

export interface SituationTypeReasonsArgs {
  filters?: InputMaybe<ReasonFilter>;
}

export interface SituationTypeExtendedOffsetPaginated {
  __typename?: "SituationTypeExtendedOffsetPaginated";
  meta: PaginationMeta;
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: SituationType[];
  /** Total count of existing results. */
  totalCount: Scalars["Int"]["output"];
}

export interface SourceFilter {
  AND?: InputMaybe<SourceFilter>;
  DISTINCT?: InputMaybe<Scalars["Boolean"]["input"]>;
  NOT?: InputMaybe<SourceFilter>;
  OR?: InputMaybe<SourceFilter>;
  tenant?: InputMaybe<Scalars["String"]["input"]>;
}

export interface SourceType {
  __typename?: "SourceType";
  name: Scalars["String"]["output"];
  tenant: Scalars["String"]["output"];
}

export interface StationProperties {
  __typename?: "StationProperties";
  id: Scalars["String"]["output"];
  latitude: Scalars["Float"]["output"];
  longitude: Scalars["Float"]["output"];
  name: Scalars["String"]["output"];
  platform: Scalars["String"]["output"];
  routedId: Scalars["String"]["output"];
}

export interface StopGraphGeometryType {
  __typename?: "StopGraphGeometryType";
  geom: Scalars["GeoJSONDict"]["output"];
  graph: Scalars["String"]["output"];
}

export interface StopGraphGeometryTypeGeomArgs {
  precision?: Scalars["Int"]["input"];
  simplify?: Scalars["Int"]["input"];
}

export interface StopInput {
  id: Scalars["ID"]["input"];
  publishedLineNames?: Scalars["String"]["input"][];
}

export interface StopResult {
  __typename?: "StopResult";
  code?: Maybe<Scalars["String"]["output"]>;
  countryCode?: Maybe<Scalars["String"]["output"]>;
  externalId?: Maybe<Scalars["String"]["output"]>;
  identSource?: Maybe<Scalars["String"]["output"]>;
  ifopt?: Maybe<Scalars["String"]["output"]>;
  matchedName?: Maybe<Scalars["String"]["output"]>;
  mot: MotChoices[];
  municipalityName?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  platforms: PlatformType[];
  rank: Scalars["Float"]["output"];
  stop: StopType;
  translatedNames: Scalars["String"]["output"][];
  uid: Scalars["String"]["output"];
}

export interface StopType {
  __typename?: "StopType";
  geom: Scalars["GeoJSONDict"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  uid: Scalars["String"]["output"];
}

export interface SuccessType {
  __typename?: "SuccessType";
  ok: Scalars["Boolean"]["output"];
}

export interface TextualContentInput {
  consequence?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  durationText?: InputMaybe<Scalars["String"]["input"]>;
  reason?: InputMaybe<Scalars["String"]["input"]>;
  recommendation?: InputMaybe<Scalars["String"]["input"]>;
  remark?: InputMaybe<Scalars["String"]["input"]>;
  summary: Scalars["String"]["input"];
  /** @deprecated Use summary instead */
  title?: InputMaybe<Scalars["String"]["input"]>;
}

export interface TextualContentType {
  __typename?: "TextualContentType";
  consequence?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  durationText?: Maybe<Scalars["String"]["output"]>;
  reason?: Maybe<Scalars["String"]["output"]>;
  recommendation?: Maybe<Scalars["String"]["output"]>;
  remark?: Maybe<Scalars["String"]["output"]>;
  summary: Scalars["String"]["output"];
  /** @deprecated Use summary instead */
  title?: Maybe<Scalars["String"]["output"]>;
}

export interface TimeIntervalType {
  __typename?: "TimeIntervalType";
  endTime: Scalars["DateTime"]["output"];
  startTime: Scalars["DateTime"]["output"];
}

export interface UpdateSituationInput {
  affectedTimeIntervals: AffectedTimeIntervalInput[];
  id: Scalars["ID"]["input"];
  isActive?: Scalars["Boolean"]["input"];
  publications: PublicationInput[];
  publicationWindows: PublicationWindowInput[];
  reasons: Scalars["String"]["input"][];
  title?: InputMaybe<Scalars["String"]["input"]>;
}

export type UpdateSituationPayload = OperationInfo | SituationType;

export type UploadImagePayload = AssetType | OperationInfo;

export interface UserType {
  __typename?: "UserType";
  configs: Scalars["JSON"]["output"];
  displayName: Scalars["String"]["output"];
  email: Scalars["String"]["output"];
  firstName: Scalars["String"]["output"];
  lastName: Scalars["String"]["output"];
  tags: Scalars["String"]["output"][];
  username: Scalars["String"]["output"];
}
