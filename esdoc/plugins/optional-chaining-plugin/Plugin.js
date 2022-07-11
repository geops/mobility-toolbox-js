module.exports = {
  onHandleCode(event) {
    // remove any optional chaining use from the incoming doc
    // eslint-disable-next-line no-param-reassign
    event.data.code = event.data.code.replace(/\?\./g, '.');
  },
};
