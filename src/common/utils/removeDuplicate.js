/**
 * This function remove duplicates string value of an array.
 * It removes also null, undefined or non string values.
 *
 * @param {array} array Array of values.
 * @ignores
 */
const removeDuplicate = (array) => {
  return [
    ...new Set(
      array.filter(
        (val) => val !== undefined && val !== null && val.trim && val.trim(),
      ),
    ),
  ];
};

export default removeDuplicate;
