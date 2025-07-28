/**
 * @private
 */
const createDefaultStopFinderElement = () => {
  const element = document.createElement('div');
  Object.assign(element.style, {
    display: 'flex',
    flexDirection: 'column',
    left: '50px',
    margin: '10px',
    maxHeight: '90%',
    position: 'absolute',
    top: 0,
    width: '320px',
  });
  return element;
};
export default createDefaultStopFinderElement;
