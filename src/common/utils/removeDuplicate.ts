/**
 * This function remove duplicates lower case string value of an array.
 * It removes also null, undefined or non string values.
 *
 * @param {array} array Array of values.
 * @ignore
 */
const removeDuplicate = (array: any[]) => {
  const arrWithoutEmptyValues = array.filter(
    (val) => val !== undefined && val !== null && val.trim && val.trim(),
  );
  const lowerCasesValues = arrWithoutEmptyValues.map((str) =>
    str.toLowerCase(),
  );
  const uniqueLowerCaseValues = [...new Set(lowerCasesValues)];
  const uniqueValues = uniqueLowerCaseValues.map((uniqueStr) =>
    arrWithoutEmptyValues.find((str) => str.toLowerCase() === uniqueStr),
  );
  return uniqueValues;
};

export default removeDuplicate;
