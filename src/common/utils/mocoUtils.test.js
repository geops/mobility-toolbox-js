import {
  getFeatureCollectionToRenderFromSituation,
  getMocoReasonCategoryImageName,
  isMocoSituationAffected,
  isMocoSituationPublished,
} from './mocoUtils';

// Category from moco
const MOCO_REASONS_CATEGORY = {
  DAS_PERSONAL_BETREFEND: 'Das Personal betreffend',
  SICHERHEITSRELEVANT: 'Sicherheitsrelevant',
  SPEZIELLE_ANLAESSE: 'Spezielle Anl\u00E4sse',
  TECHNISCHE_PROBLEME: 'Technische Probleme',
  UMWELTEINFLUESSE: 'Umwelteinflüsse',
  UNDEFINIERT: 'Undefiniert',
  UNFALL: 'Unfall',
  VERKEHRLICHE_GRUENDE: 'Verkehrliche Gr\u00FCnde',
  VERSCHIEDENES: 'Verschiedenes',
};

const MOCO_IMAGE_BY_CATEGORY = {
  [MOCO_REASONS_CATEGORY.DAS_PERSONAL_BETREFEND]: 'das_personal_betreffend',
  [MOCO_REASONS_CATEGORY.SICHERHEITSRELEVANT]: 'sicherheitsrelevant',
  [MOCO_REASONS_CATEGORY.SPEZIELLE_ANLAESSE]: 'spezielle_anlaesse',
  [MOCO_REASONS_CATEGORY.TECHNISCHE_PROBLEME]: 'technische_probleme',
  [MOCO_REASONS_CATEGORY.UMWELTEINFLUESSE]: 'umwelteinfluesse',
  [MOCO_REASONS_CATEGORY.UNDEFINIERT]: 'undefiniert',
  [MOCO_REASONS_CATEGORY.UNFALL]: 'unfall',
  [MOCO_REASONS_CATEGORY.VERKEHRLICHE_GRUENDE]: 'verkehrliche_gruende',
  [MOCO_REASONS_CATEGORY.VERSCHIEDENES]: 'verschiedenes',
};

describe('mocoUtils', () => {
  test('getReasonsCategoryImageName', () => {
    Object.entries(MOCO_IMAGE_BY_CATEGORY).forEach(([key, value]) => {
      expect(getMocoReasonCategoryImageName(key)).toBe(value);
    });
  });

  describe('isMocoSituationAffected', () => {
    test('using start and end', () => {
      expect(isMocoSituationAffected({ affectedTimeIntervals: [] })).toBe(
        false,
      );
      expect(isMocoSituationAffected({ affectedTimeIntervals: null })).toBe(
        false,
      );
      expect(
        isMocoSituationAffected({ affectedTimeIntervals: undefined }),
      ).toBe(false);

      expect(
        isMocoSituationAffected(
          {
            affectedTimeIntervals: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('1999-01-01T00:00:00Z'),
        ),
      ).toBe(false);

      expect(
        isMocoSituationAffected(
          {
            affectedTimeIntervals: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('2000-01-01T00:00:00Z'),
        ),
      ).toBe(true);

      expect(
        isMocoSituationAffected(
          {
            affectedTimeIntervals: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('2000-01-10T10:00:00Z'),
        ),
      ).toBe(true);

      expect(
        isMocoSituationAffected(
          {
            affectedTimeIntervals: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('2000-01-10T11:00:00Z'),
        ),
      ).toBe(false);
    });

    test('using dailyStart and dailyEnd', () => {
      expect(
        isMocoSituationAffected(
          {
            affectedTimeIntervals: [
              {
                dailyEndTime: '10:00:00',
                dailyStartTime: '08:00:00',
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('2000-01-02T06:00:00Z'),
        ),
      ).toBe(false);

      expect(
        isMocoSituationAffected(
          {
            affectedTimeIntervals: [
              {
                dailyEndTime: '10:00:00',
                dailyStartTime: '08:00:00',
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('2000-01-02T09:00:00Z'),
        ),
      ).toBe(true);
    });
  });

  describe('isMocoSituationPublished', () => {
    test('using affectedTimeIntervals', () => {
      expect(
        isMocoSituationPublished(
          {
            affectedTimeIntervals: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
            publicationWindows: [],
          },
          new Date('2000-01-02T00:00:00Z'),
        ),
      ).toBe(true);
    });

    test('using start and end', () => {
      expect(isMocoSituationAffected({ publicationWindows: [] })).toBe(false);
      expect(isMocoSituationAffected({ publicationWindows: null })).toBe(false);
      expect(isMocoSituationAffected({ publicationWindows: undefined })).toBe(
        false,
      );

      expect(
        isMocoSituationPublished(
          {
            publicationWindows: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('1999-01-01T00:00:00Z'),
        ),
      ).toBe(false);

      expect(
        isMocoSituationPublished(
          {
            publicationWindows: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('2000-01-01T00:00:00Z'),
        ),
      ).toBe(true);

      expect(
        isMocoSituationPublished(
          {
            publicationWindows: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('2000-01-10T10:00:00Z'),
        ),
      ).toBe(true);

      expect(
        isMocoSituationPublished(
          {
            publicationWindows: [
              {
                endTime: '2000-01-10T10:00:00Z',
                startTime: '2000-01-01T00:00:00Z',
              },
            ],
          },
          new Date('2000-01-10T11:00:00Z'),
        ),
      ).toBe(false);
    });
  });

  describe('getFeatureCollectionToRenderFromSituation', () => {
    test('return a FeatureCollection with correct properties', () => {
      const situation = {
        affectedTimeIntervals: [
          {
            endTime: '2025-09-26T23:00:00+00:00',
            startTime: '2025-05-14T03:00:00+00:00',
          },
        ],
        affectedTimeIntervalsEnd: '2025-09-26T23:00:00+00:00',
        affectedTimeIntervalsStart: '2025-05-14T03:00:00+00:00',
        id: '374718',
        publicationLineNames: ['11'],
        publications: [
          {
            id: 'publication-1-374718',
            publicationLines: [
              {
                category: 'DISRUPTION',
                hasIcon: true,
                lines: [
                  {
                    geometry: [
                      {
                        geom: {
                          coordinates: [
                            [
                              [871575, 6104455],
                              [871366, 6104451],
                              [871255, 6104436],
                            ],
                            [
                              [871255, 6104436],
                              [871037, 6104403],
                              [870841, 6104368],
                              [870788, 6104355],
                            ],
                            [
                              [870788, 6104355],
                              [870693, 6104330],
                              [870644, 6104313],
                              [870622, 6104304],
                              [870550, 6104270],
                              [870487, 6104248],
                              [870365, 6104221],
                              [870214, 6104195],
                              [869958, 6104146],
                              [869855, 6104129],
                              [869789, 6104121],
                              [869676, 6104132],
                              [869538, 6104143],
                              [869509, 6104147],
                              [869380, 6104171],
                              [869366, 6104176],
                              [869333, 6104115],
                              [869296, 6104055],
                              [869285, 6104054],
                              [869277, 6104048],
                              [869248, 6104049],
                              [869231, 6104048],
                              [869129, 6104019],
                            ],
                          ],
                          type: 'MultiLineString',
                        },
                        graph: 'osm',
                      },
                    ],
                    name: '11',
                    operatorRef: '',
                  },
                ],
              },
            ],
            publicationStops: [
              {
                geometry: [
                  {
                    geom: {
                      coordinates: [878885, 6103826],
                      type: 'Point',
                    },
                    graph: 'osm',
                  },
                ],
                id: 'lala',
                name: 'Freiburg-Littenweiler',
                uid: 'a33509cdf7463912',
              },
            ],
            publicationWindows: [
              {
                endTime: '2500-12-31T00:10:00+00:00',
                startTime: '2025-05-12T03:00:00+00:00',
              },
            ],
            serviceCondition: 'DISCONTINUED_OPERATION',
            serviceConditionGroup: 'DISRUPTION',
            severity: 'VERY_SEVERE',
            severityGroup: 'HIGH',
            textualContentLarge: {
              de: {
                summary:
                  'Haltestellen Oberried (Breisgau) Sternen/Post und Oberried (Breisgau) Adler: Haltestellenverlegung wegen einer Baumaßnahmexx',
              },
            },
          },
        ],
        publicationStopNames: [],
        publicationWindows: [
          {
            endTime: '2500-12-31T00:10:00+00:00',
            startTime: '2025-05-12T03:00:00+00:00',
          },
        ],
        publicationWindowsEnd: '2500-12-31T00:10:00+00:00',
        publicationWindowsStart: '2025-05-12T03:00:00+00:00',
        reasons: [
          {
            categoryName: 'Unfall',
            name: 'Aufprall eines Objekts',
            tenant: 'rvf',
          },
        ],
        title:
          'Haltestellen Oberried (Breisgau) Sternen/Post und Oberried (Breisgau) Adler: Haltestellenverlegung wegen einer Baumaßnahmexx',
      };

      const featureCollection = getFeatureCollectionToRenderFromSituation(
        situation,
        new Date('2025-09-01T00:00:00+00:00'),
      );

      expect(featureCollection.type).toBe('FeatureCollection');
      expect(featureCollection.features.length).toBe(3);

      // We test the line properties
      const lineProps = featureCollection.features[0].properties;
      expect(lineProps.publicationId).toBe('publication-1-374718');
      expect(lineProps.graph).toBe('osm');
      expect(lineProps.serviceConditionGroup).toBe('DISRUPTION');
      expect(lineProps.severityGroup).toBe('HIGH');
      expect(lineProps.hasIcon).toBe(true);
      expect(lineProps.situationId).toBe('374718');
      expect(lineProps.reasons[0].name).toBe('Aufprall eines Objekts');
      expect(lineProps.reasonCategoryImageName).toBe('unfall');
      expect(lineProps.isAffected).toBe(true);
      expect(lineProps.isPublished).toBe(true);

      expect(lineProps.graph).toBeDefined();
      expect(lineProps.serviceConditionGroup).toBeDefined();
      expect(lineProps.severityGroup).toBeDefined();
      expect(lineProps.situationId).toBe('374718');
      expect(lineProps.reasons[0].name).toBeDefined();
      expect(lineProps.reasonCategoryImageName).toBeDefined();
      expect(lineProps.isAffected).toBeDefined();
      expect(lineProps.isPublished).toBeDefined();

      // for v1 backward compatibility
      expect(lineProps.condition_group).toBe(
        lineProps.serviceConditionGroup.toLowerCase(),
      );
      expect(lineProps.severity_group).toBe(
        lineProps.severityGroup.toLowerCase(),
      );
      expect(lineProps.reasons_category).toBe(
        lineProps.reasonCategoryImageName,
      );
      expect(lineProps.isActive).toBe(lineProps.isAffected);

      // We test the icon ref properties
      const iconRefProps = featureCollection.features[1].properties;

      expect(lineProps.publicationId).toBe(iconRefProps.publicationId);
      expect(lineProps.graph).toBe(iconRefProps.graph);
      expect(lineProps.serviceConditionGroup).toBe(
        iconRefProps.serviceConditionGroup,
      );
      expect(lineProps.severityGroup).toBe(iconRefProps.severityGroup);
      expect(lineProps.hasIcon).toBe(iconRefProps.hasIcon);
      expect(lineProps.situationId).toBe(iconRefProps.situationId);
      expect(lineProps.reasonCategoryImageName).toBe(
        iconRefProps.reasonCategoryImageName,
      );
      expect(lineProps.isAffected).toBe(iconRefProps.isAffected);
      expect(lineProps.isPublished).toBe(iconRefProps.isPublished);

      // for v1 backward compatibility
      expect(lineProps.condition_group).toBe(iconRefProps.condition_group);
      expect(lineProps.severity_group).toBe(iconRefProps.severity_group);
      expect(lineProps.reasons_category).toBe(iconRefProps.reasons_category);
      expect(lineProps.isActive).toBe(iconRefProps.isActive);

      // We test the stop properties
      const stopProps = featureCollection.features[2].properties;
      expect(lineProps.publicationId).toBe(stopProps.publicationId);
      expect(lineProps.graph).toBe(stopProps.graph);
      expect(lineProps.serviceConditionGroup).toBe(
        stopProps.serviceConditionGroup,
      );
      expect(lineProps.severityGroup).toBe(stopProps.severityGroup);
      expect(stopProps.hasIcon).toBe(undefined);
      expect(lineProps.id).toBe(stopProps.id);
      expect(lineProps.reasonCategoryImageName).toBe(
        stopProps.reasonCategoryImageName,
      );
      expect(lineProps.isAffected).toBe(stopProps.isAffected);
      expect(lineProps.isPublished).toBe(stopProps.isPublished);

      // for v1 backward compatibility
      expect(lineProps.condition_group).toBe(stopProps.condition_group);
      expect(lineProps.severity_group).toBe(stopProps.severity_group);
      expect(lineProps.reasons_category).toBe(stopProps.reasons_category);
      expect(lineProps.isActive).toBe(stopProps.isActive);

      // The geometry property is used by ol to store the ol/geom object so it is important that it stayed undefined
      expect(stopProps.geometry).toBe(undefined);
    });
  });
});
