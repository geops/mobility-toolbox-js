/**
 * @private
 */
const createDefaultCopyrightElement = () => {
  const element = document.createElement('div');
  Object.assign(element.style, {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: '.8rem',
    padding: '0 10px',
  });
  return element;
};
export default createDefaultCopyrightElement;
