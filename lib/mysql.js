"use strict";

const assert = require("assert");
const mysql = require("mysql");
const SQLWriteStream = require("./SQLWriteStream");

exports.createReadStream = options => {
  assert.ok(options.connectionUrl, "options.connectionUrl is required attribute");
  assert.ok(options.sql, "options.sql is required attribute");
  let connection = mysql.createConnection(options.connectionUrl);
  return connection.query(options.sql).stream(options);
};

class MySQLWriteStream extends SQLWriteStream {
  createConnection(callback) {
    if (this.connectionUrl.indexOf("?") === -1) {
      this.connectionUrl += "?connectTimeout=300000&acquireTimeout=300000";
    } else {
      this.connectionUrl += "&connectTimeout=300000&acquireTimeout=300000";
    }

    this.connection = mysql.createPool(this.connectionUrl);
    callback(null, this.connection);
  }

  closeConnection(callback) {
    // console.log('closing mysql connection')
    this.connection.end(err => {
      // console.log('mysql connection closed')
      callback(err);
    });
  }

  insertObjects(objects, callback) {
    let keys = [];
    let columns = [];
    for (let i in objects[0]) {
      keys.push(i + " = VALUES(" + i + ")");
      columns.push(i);
    }

    let values = [];
    objects.forEach(object => {
      let objectValues = [];
      columns.forEach(column => {
        let value = object[column];
        if (value && value.substring && value.substring(0, 2) === "`(") {
          value = value.replace(/^`\(/g, "(").replace(/\)`$/g, ")");
        } else {
          value = mysql.escape(value);
        }
        objectValues.push(value);
      });
      values.push(objectValues);
    });

    let sql = "INSERT INTO " + mysql.escapeId(this.table) + " (" + columns.join(",") + ") VALUES ";

    sql += values.map(value => "(" + value.join(",") + ")").join(",");

    sql += " ON DUPLICATE KEY UPDATE " + keys.join(",");

    this.connection.query(sql, err => {
      callback(err);
    });
  }
}

exports.createWriteStream = options => {
  return new MySQLWriteStream(options);
};
