import trackerDefaultStyle from './trackerDefaultStyle';

/**
 * A tracker style that display the delay as backgroundColor.
 *
 * @param {*} trajectory The trajectory to render.
 * @param {*} viewState The view state of the map.
 * @param {*} options Some options to change the rendering
 * @return a canvas
 */
const style = (trajectory, viewState, options) => {
  return trackerDefaultStyle(trajectory, viewState, {
    ...options,
    useDelayStyle: true,
  });
};
export default style;
