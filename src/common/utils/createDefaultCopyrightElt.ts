/**
 * @private
 */
const createDefaultCopyrightElement = () => {
  const element = document.createElement('div');
  Object.assign(element.style, {
    bottom: 0,
    fontSize: '.8rem',
    padding: '0 10px',
    position: 'absolute',
    right: 0,
  });
  return element;
};
export default createDefaultCopyrightElement;
