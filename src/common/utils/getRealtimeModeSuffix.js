/**
 * Get the websocket channel suffix, depending on the current mode.
 * @param {String} mode Mode 'topographic' ou 'schematic'.
 * @private
 */
const getModeSuffix = (mode, modes) =>
  mode === modes.SCHEMATIC ? '_schematic' : '';

export default getModeSuffix;
