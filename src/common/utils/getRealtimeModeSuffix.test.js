import { RealtimeModes } from '../../ol';
import getRealtimeModeSuffix from './getRealtimeModeSuffix';

describe('getRealtimeModeSuffix', () => {
  test('return string for topographic mode', () => {
    expect(
      getRealtimeModeSuffix(RealtimeModes.TOPOGRAPHIC, RealtimeModes),
    ).toBe('');
    expect(
      getRealtimeModeSuffix(RealtimeModes.TOPOGRAPHIC, RealtimeModes, 'tenant'),
    ).toBe('');
  });

  test('return string for schematic mode', () => {
    expect(getRealtimeModeSuffix(RealtimeModes.SCHEMATIC, RealtimeModes)).toBe(
      '_schematic',
    );
    expect(
      getRealtimeModeSuffix(RealtimeModes.SCHEMATIC, RealtimeModes, 'tenant'),
    ).toBe('_schematic_tenant');
  });
});
