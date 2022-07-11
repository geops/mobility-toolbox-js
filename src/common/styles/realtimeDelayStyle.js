import realtimeDefaultStyle from './realtimeDefaultStyle';

/**
 * A tracker style that display the delay as backgroundColor.
 *
 * @param {*} trajectory The trajectory to render.
 * @param {*} viewState The view state of the map.
 * @param {*} options Some options to change the rendering
 * @return a canvas
 */
const realtimeDelayStyle = (trajectory, viewState, options) => {
  return realtimeDefaultStyle(trajectory, viewState, {
    ...options,
    useDelayStyle: true,
  });
};
export default realtimeDelayStyle;
