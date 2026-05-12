import { Realtime } from '../../types';

/**
 * Get the websocket channel suffix, depending on the current mode.
 * @param {String} mode Mode 'topographic' ou 'schematic'.
 * @private
 */
const getModeSuffix = (mode: Realtime.Mode): string => {
  return mode === Realtime.ModeEnum.SCHEMATIC ? '_schematic' : '';
};

export default getModeSuffix;
