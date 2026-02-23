/**
 * This function checks if a value is a positive number or zero.
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} - True if the value is a positive number or zero, false otherwise.
 */
function isPositiveNumberOrZero(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export default isPositiveNumberOrZero;
