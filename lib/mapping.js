const through2 = require('through2');
const querystring = require('querystring');

const mappingStream = mapping => {
  const mappingObj = querystring.parse(mapping);
  return through2.obj((obj, enc, callback) => {
    let result = {};
    for (let key in mappingObj) {
      result[key] = obj[mappingObj[key]];
    }
    callback(null, result);
  });
};

module.exports = {
  mappingStream
};
