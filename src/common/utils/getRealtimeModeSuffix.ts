import type { RealtimeMode, RealtimeTenant } from '../../types';
import type { RealtimeModesType } from '../../api/RealtimeAPI';

/**
 * Get the websocket channel suffix, depending on the current mode.
 * @param {String} mode Mode 'topographic' ou 'schematic'.
 * @private
 */
const getRealtimeModeSuffix = (
  mode: RealtimeMode,
  modes: RealtimeModesType,
  tenant?: RealtimeTenant,
): string => {
  const schematicSuffix = ['', 'schematic'];

  if (tenant) {
    schematicSuffix.push(tenant);
  }

  return mode === modes.SCHEMATIC ? schematicSuffix.join('_') : '';
};

export default getRealtimeModeSuffix;
