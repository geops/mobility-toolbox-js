/**
 * Get a Date object as UTC date string .
 * ex: 2019 09 01
 * @ignore
 */
export const getUTCDateString = (now = new Date()) => {
  let month = (now.getUTCMonth() + 1).toString();
  month = month.length === 1 ? `0${month}` : month;
  let day = now.getUTCDate().toString();
  day = day.length === 1 ? `0${day}` : day;

  return [now.getUTCFullYear(), month, day].join('');
};

/**
 * Get the UTC time string of Date object.
 * ex: 09:05:01.123
 * @ignore
 */
export const getUTCTimeString = (date) =>
  [
    date.getUTCHours(),
    date.getUTCMinutes(),
    `${date.getUTCSeconds()}.${date.getUTCMilliseconds()}`,
  ].join(':');

/**
 * Returns a string representation of a number, with a zero if the number is lower than 10.
 * @ignore
 */
export const pad = (integer) => (integer < 10 ? `0${integer}` : integer);

/**
 * Returns a 'hh:mm' string from a time in ms.
 * @param {Number} timeInMs Time in milliseconds.
 * @ignore
 */
export const getHoursAndMinutes = (timeInMs) => {
  if (!timeInMs || timeInMs <= 0) {
    return '';
  }
  const date = new Date(timeInMs);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
