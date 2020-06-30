import {
  getDateString,
  getUTCTimeString,
  getHoursAndMinutes,
  getDelayString,
} from './timeUtils';

describe('timeUtils', () => {
  test('getDateString should be correct.', () => {
    expect(getDateString(new Date(2020, 5, 30))).toBe('20200630');
  });

  test('getUTCTimeString should be correct.', () => {
    expect(getUTCTimeString(new Date(2020, 5, 30, 11, 5, 1, 123))).toBe(
      '9:5:1.123',
    );
  });

  test('getHoursAndMinutes should be correct.', () => {
    expect(getHoursAndMinutes(123456)).toBe('01:02');
  });

  test('getDelayString should be correct.', () => {
    expect(getDelayString(123456)).toBe('2m3s');
  });
});
