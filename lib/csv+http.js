const assert = require('assert');
const csv = require('csv-stream');
const request = require('request');
const url = require('url');
const { mappingStream } = require('./mapping');

exports.createReadStream = options => {
  assert.ok(options.url, 'options.url is required attribute');

  // All of these arguments are optional.
  const csvOptions = {
    delimiter: ';' // default is ,
    // endLine: '\n', // default is \n,
    // columns: ['columnName1', 'columnName2'], // by default read the first line and use values found as columns
    // columnOffset: 2, // default is 0
    // escapeChar: '"', // default is an empty string
    // enclosedChar: '"' // default is an empty string
  };

  const csvStream = csv.createStream(csvOptions);
  let stream = request(options.url.replace('csv+', '')).pipe(csvStream);

  if (options.mapping) {
    stream = stream.pipe(mappingStream(options.mapping));
  }

  return stream;
};
