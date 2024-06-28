/**
 * @private
 */
const createDefaultStopFinderElement = () => {
  const element = document.createElement('div');
  Object.assign(element.style, {
    position: 'absolute',
    top: 0,
    left: '50px',
    margin: '10px',
    display: 'flex',
    flexDirection: 'column',
    width: '320px',
    maxHeight: '90%',
  });
  return element;
};
export default createDefaultStopFinderElement;
