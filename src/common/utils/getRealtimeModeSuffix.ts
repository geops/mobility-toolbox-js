import type { RealtimeMode } from '../../types';
import type { RealtimeModesType } from '../../api/RealtimeAPI';

/**
 * Get the websocket channel suffix, depending on the current mode.
 * @param {String} mode Mode 'topographic' ou 'schematic'.
 * @private
 */
const getModeSuffix = (mode: RealtimeMode, modes: RealtimeModesType): string =>
  mode === modes.SCHEMATIC ? '_schematic' : '';

export default getModeSuffix;
