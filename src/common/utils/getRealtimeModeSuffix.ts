import type { RealtimeModesType } from '../../api/RealtimeAPI';
import type { RealtimeMode } from '../../types';

/**
 * Get the websocket channel suffix, depending on the current mode.
 * @param {String} mode Mode 'topographic' ou 'schematic'.
 * @param {String[]} modes List of modes
 * @private
 */
const getModeSuffix = (
  mode: RealtimeMode,
  modes: RealtimeModesType,
): string => {
  return mode === modes.SCHEMATIC ? '_schematic' : '';
};

export default getModeSuffix;
