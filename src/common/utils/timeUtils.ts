/**
 * Get a Date object as UTC date string .
 * ex: 2019 09 01
 * @private
 */
export const getUTCDateString = (now = new Date()): string => {
  let month = (now.getUTCMonth() + 1).toString();
  month = month.length === 1 ? `0${month}` : month;
  let day = now.getUTCDate().toString();
  day = day.length === 1 ? `0${day}` : day;

  return [now.getUTCFullYear(), month, day].join('');
};

/**
 * Get the UTC time string of Date object.
 * ex: 09:05:01.123
 * @private
 */
export const getUTCTimeString = (date: Date): string =>
  [
    date.getUTCHours(),
    date.getUTCMinutes(),
    `${date.getUTCSeconds()}.${date.getUTCMilliseconds()}`,
  ].join(':');

/**
 * Returns a string representation of a number, with a zero if the number is lower than 10.
 * @private
 */
export const pad = (integer: number): string =>
  integer < 10 ? `0${integer}` : `${integer}`;

/**
 * Returns a 'hh:mm' string from a time in ms.
 * @param {Number} timeInMs Time in milliseconds.
 * @private
 */
export const getHoursAndMinutes = (timeInMs: number): string => {
  if (!timeInMs || timeInMs <= 0) {
    return '';
  }
  const date = new Date(timeInMs);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
