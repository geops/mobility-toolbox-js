export type MocoNotification = {
  properties: MocoNotificationProperties & MocoNotificationStatusProperties;
} & GeoJSON.FeatureCollection<
  GeoJSONGeometry,
  MocoNotificationFeatureProperties
>;

export type MocoNotificationAsFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSONGeometry,
  MocoNotificationFeatureProperties & MocoNotificationProperties
>;

export type MocoAffectedTimeInterval = {
  start: string; // "2025-06-18T13:00:00
  end: string; // "2500-12-31T00:00:00"
  time_of_day_start: string | null; // null
  time_of_day_end: string | null; // null
};

export interface MocoNotificationFeatureProperties {
  affected_products: { name: string; operator: string }[];
  condition: string; //'unknown';
  condition_group: string; //'information';
  disruption_type: string; //'DISRUPTION';
  graph: string; //'osm';
  is_icon_ref: boolean; //false;
  // periods: object[];
  severity: string; //'unknown';
  severity_group: string; //'information';
  stops: {
    external_code: null | string; //null;
    external_id: null | string; //null;
    name: string; //'Freiamt Hintere Höfe';
    uid: string; //'a4748918a5b0e1be';
  }[];
}

export interface MocoNotificationIconRefFeatureProperties
  extends MocoNotificationFeatureProperties {
  disruption_type_banner?: string; // 'DISRUPTION';
  isIconRefPoint?: boolean; // true;
}

export interface MocoNotificationProperties {
  id: number; //371966,
  affected_time_intervals: MocoAffectedTimeInterval[];
  publications: {
    visible_from: string; //"2025-06-18T13:00:00Z",
    visible_until: string; //"2500-12-31T00:10:00Z",
    channel: string; //"DEFAULT",
    index: number; //0
  }[];
  links: object[];
  images: object[];
  sso_config: string; //"rvf",
  title: string; //"Haltestelle Pforzheim Parkstraße: Verlegung wegen Bauarbeiten",
  long_description: string; //"<p>Haltestelle Pforzheim Parkstraße: Verlegung wegen Bauarbeiten</p><p></p>",
  category: string; //"DISRUPTION",
  start_stop: string | null; //null,
  end_stop: string | null; //null,
  size: string; //"M",
  default_language: string; //"de",
  title_de: string; //"",
  title_fr: string; //"",
  title_it: string; //"",
  title_en: string; //"",
  summary_de: string; //"Haltestelle Pforzheim Parkstraße: Verlegung wegen Bauarbeiten",
  summary_fr: string; //"",
  summary_it: string; //"",
  summary_en: string; //"",
  reason_de: string; //"Bauarbeiten",
  reason_fr: string; //"",
  reason_it: string; //"",
  reason_en: string; //"",
  description_de: string; //"",
  description_fr: string; //"",
  description_it: string; //"",
  description_en: string; //"",
  consequence_de: string; //"Verlegung",
  consequence_fr: string; //"",
  consequence_it: string; //"",
  consequence_en: string; //"",
  duration_text_de: string; //"",
  duration_text_fr: string; //"",
  duration_text_it: string; //"",
  duration_text_en: string; //"",
  recommendation_de: string; //"",
  recommendation_fr: string; //"",
  recommendation_it: string; //string; //"",
  recommendation_en: '';
  reasons: {
    name: string; //"constructionWork",
    category_name: string; //""
  }[];
}

export interface MocoNotificationStatusProperties {
  isActive?: boolean;
  isPublished?: boolean;
  starts?: string;
}
