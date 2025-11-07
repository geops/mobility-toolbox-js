import {
  type RealtimeStyleFunction,
  type RealtimeStyleOptions,
  type RealtimeTrajectory,
  type ViewState,
} from '../../types';

import realtimeStyle from './realtimeStyle';

/**
 * A realtime style that uses colors depending on the line.
 *
 * @param {RealtimeTrajectory} trajectory The trajectory to render.
 * @param {ViewState} viewState The view state of the map.
 * @param {RealtimeStyleOptions} options Some options to change the rendering
 * @return a canvas
 * @private
 */
const realtimeByLineStyle: RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => {
  return realtimeStyle(trajectory, viewState, {
    ...options,
    getColor: (traj?: RealtimeTrajectory): string => {
      let color = traj?.properties?.line?.color;

      if (color && !color.startsWith('#')) {
        color = `#${color}`;
      }
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return color || '#000';
    },
    getTextColor: (traj?: RealtimeTrajectory) => {
      let color = traj?.properties?.line?.text_color;

      if (color && !color.startsWith('#')) {
        color = `#${color}`;
      }
      return color || '#fff';
    },
  });
};

export default realtimeByLineStyle;
