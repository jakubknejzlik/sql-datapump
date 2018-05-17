'use strict';

const transfer = require('./lib/transfer');

const event = {
  sourceUrl: process.env.SOURCE_URL,
  sourceSQL: process.env.SOURCE_QUERY,
  sourceMapping: process.env.SOURCE_MAPPING,
  destinationUrl: process.env.DESTINATION_URL,
  destinationTable: process.env.DESTINATION_TABLE
};

console.log(`starting transfer`);
transfer(event)
  .then(() => {
    console.log('transfer completed');
  })
  .catch(err => {
    console.log(`failed to transfer data ${err.message}`);
    process.exit(1);
  });
