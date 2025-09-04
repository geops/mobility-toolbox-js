import { getMocoReasonCategoryImageName } from './mocoUtils';

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
});
