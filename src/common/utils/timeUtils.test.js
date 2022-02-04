import { getUTCDateString, getUTCTimeString } from './timeUtils';

describe('timeUtils', () => {
  test('getUTCDateString should be correct.', () => {
    expect(getUTCDateString(new Date(2020, 5, 30))).toBe('20200630');
    expect(
      getUTCDateString(new Date('January 1, 2021 00:15:30 GMT+2:00')),
    ).toBe('20201231');
  });

  test('getUTCTimeString should be correct.', () => {
    expect(getUTCTimeString(new Date(2020, 5, 30, 11, 5, 1, 123))).toBe(
      '11:5:1.123',
    );
  });
});
