import realtimeDefaultStyle from './realtimeDefaultStyle';

import type {
  RealtimeTrajectory,
  ViewState,
  RealtimeStyleOptions,
  RealtimeStyleFunction,
} from '../../types';
/**
 * A tracker style that display the delay as backgroundColor.
 *
 * @param {*} trajectory The trajectory to render.
 * @param {*} viewState The view state of the map.
 * @param {*} options Some options to change the rendering
 * @return a canvas
 * @private
 */
const realtimeDelayStyle: RealtimeStyleFunction = (
  trajectory: RealtimeTrajectory,
  viewState: ViewState,
  options: RealtimeStyleOptions,
) => {
  return realtimeDefaultStyle(trajectory, viewState, {
    ...options,
    useDelayStyle: true,
  });
};
export default realtimeDelayStyle;
