/**
 * build deprecated html.
 * https://github.com/esdoc/esdoc-plugins/blob/2de5022baa569785a189056a99acd1d7ca8284b7/esdoc-publish-html-plugin/src/Builder/DocBuilder.js#L920
 * @param {DocObject} doc - target doc object.
 * @returns {string} if doc is not deprecated, returns empty.
 * @private
 */
const DeprecatedHTML = (doc) => {
  if (doc.deprecated) {
    const deprecated = [`this ${doc.kind} was deprecated.`];
    if (typeof doc.deprecated === 'string') deprecated.push(doc.deprecated);
    return deprecated.join(' ');
  }
  return '';
};
export default DeprecatedHTML;
