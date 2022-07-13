module.exports = {
  onHandleCode(event) {
    // THis is a hack until esdoc supports it.
    // remove any optional chaining use from the incoming doc
    // eslint-disable-next-line no-param-reassign
    event.data.code = event.data.code.replace(/\?\./g, '.');
  },
};
