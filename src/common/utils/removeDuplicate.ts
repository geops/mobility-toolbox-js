/**
 * This function remove duplicates lower case string value of an array.
 * It removes also null, undefined or non string values.
 *
 * @param {array} array Array of values.
 * @private
 */
const removeDuplicate = (array: any[]) => {
  const arrWithoutEmptyValues = array.filter((val) => {
    return val?.trim?.();
  });
  const lowerCasesValues = arrWithoutEmptyValues.map((str) => {
    return str.toLowerCase();
  });
  const uniqueLowerCaseValues = [...new Set(lowerCasesValues)];
  const uniqueValues = uniqueLowerCaseValues.map((uniqueStr) => {
    return arrWithoutEmptyValues.find((str) => {
      return str.toLowerCase() === uniqueStr;
    });
  });
  return uniqueValues;
};

export default removeDuplicate;
