/**
 * build experimental html.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L936
 * @param {DocObject} doc - target doc object.
 * @returns {string} if doc is not experimental, returns empty.
 * @private
 */
const ExperimentalHTML = (doc) => {
  if (doc.experimental) {
    const experimental = [`this ${doc.kind} is experimental.`];
    if (typeof doc.experimental === 'string')
      experimental.push(doc.experimental);
    return experimental.join(' ');
  }
  return '';
};
export default ExperimentalHTML;
