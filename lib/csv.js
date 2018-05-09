const assert = require('assert');
const csv = require('csv-stream');
const fs = require('fs');
const url = require('url');

exports.createReadStream = options => {
  assert.ok(options.url, 'options.url is required attribute');

  // All of these arguments are optional.
  const csvOptions = {
    // delimiter: '\t', // default is ,
    // endLine: '\n', // default is \n,
    // columns: ['columnName1', 'columnName2'], // by default read the first line and use values found as columns
    // columnOffset: 2, // default is 0
    // escapeChar: '"', // default is an empty string
    // enclosedChar: '"' // default is an empty string
  };

  const csvStream = csv.createStream(csvOptions);
  return fs.createReadStream(options.url.replace('csv://', '')).pipe(csvStream);
};
