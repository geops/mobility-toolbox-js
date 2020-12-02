/**
 * Convert a string into an array.
 * @param {String|String[]} value The value to convert
 */
const getArrayFromString = (value) => {
  if (Array.isArray(value)) {
    console.log(value);
    return value;
  }
  return [value];
};
export default getArrayFromString;
