const assert = require("assert");
const url = require("url");
const Promise = require("bluebird");

const connections = {
  mssql: require("./mssql"),
  mysql: require("./mysql")
};

module.exports = function transfer(event) {
  return new Promise((resolve, reject) => {
    assert.ok(event.sourceUrl, "sourceConnection property missing");
    assert.ok(event.sourceSQL, "sourceSQL property missing");
    assert.ok(event.destinationUrl, "destinationConnection property missing");
    assert.ok(event.destinationTable, "destinationTable property missing");

    let sourceConnectionURL = event.sourceUrl;
    let sourceSQL = event.sourceSQL;
    let destinationConnectionURL = event.destinationUrl;
    let destinationTable = event.destinationTable;

    let _sourceConnectionURL = url.parse(sourceConnectionURL);
    let _destinationConnectionURL = url.parse(destinationConnectionURL);

    let source = connections[_sourceConnectionURL.protocol.replace(":", "")];
    let destination = connections[_destinationConnectionURL.protocol.replace(":", "")];

    if (!source) return callback(new Error("source protocol not supported"));
    if (!destination) return callback(new Error("destination protocol not supported"));

    let read = source.createReadStream({
      connectionUrl: sourceConnectionURL,
      sql: sourceSQL
    });
    let write = destination.createWriteStream({
      connectionUrl: destinationConnectionURL,
      table: destinationTable
    });

    write.on("finish", () => {
      resolve(null);
    });

    write.on("error", reject);
    read.on("error", reject);

    read.pipe(write);
  });
};
