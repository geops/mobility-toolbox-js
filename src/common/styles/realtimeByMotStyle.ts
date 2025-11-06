import { styleOptions } from '../utils/realtimeConfig';

import realtimeStyle from './realtimeStyle';

import type {
  RealtimeStyleFunction,
  RealtimeStyleOptions,
  RealtimeTrajectory,
  ViewState,
} from '../../types';

/**
 * A realtime style that display a circle, a delay (halo and text) and an arrow (heading).
 * The colors (texts and circle) can be defined in the options.
 *
 * @param {RealtimeTrajectory} trajectory The trajectory to render.
 * @param {ViewState} viewState The view state of the map.
 * @param {RealtimeStyleOptions} options Some options to change the rendering
 * @return a canvas
 */
const realtimeByMotStyle: RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => {
  return realtimeStyle(trajectory, viewState, {
    ...styleOptions,
    ...options,
  });
};
export default realtimeByMotStyle;
