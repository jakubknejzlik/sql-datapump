"use strict";

const assert = require("assert");
const mysql = require("mysql");
const mssql = require("mssql");
const SQLWriteStream = require("./SQLWriteStream");
const Readable = require("stream").Readable;

class MSSQLReadStream extends Readable {
  constructor(options) {
    assert.ok(options.connectionUrl, "options.connectionUrl is required attribute");
    assert.ok(options.sql, "options.sql is required attribute");
    options.objectMode = true;
    super(options);
    this.connectionUrl = options.connectionUrl;
    this.sql = options.sql;
    this.readingData = false;
    this.readingDataFinished = false;
    this.buffer = [];

    if (this.connectionUrl.indexOf("?") === -1) {
      this.connectionUrl += "?requestTimeout=300000";
    } else {
      this.connectionUrl += "&requestTimeout=300000";
    }
  }

  getConnection(callback) {
    if (this.connection) return callback(null, this.connection);
    let connection = mssql.connect(this.connectionUrl, err => {
      if (err) return callback(err);
      this.connection = connection;
      callback(null, connection);
    });
  }

  _read(size) {
    if (!this.readingData && !this.readingDataFinished) this.startReadingData();
    this.pushDataWhenAvailable();
  }

  startReadingData() {
    this.readingData = true;
    this.getConnection((err, connection) => {
      if (err) throw err;

      let request = new mssql.Request(connection);
      request.stream = true;
      request.on("done", () => {
        this.readingData = false;
        this.readingDataFinished = true;
        connection.close();
      });

      request.on("error", error => {
        this.emit("error", error);
      });

      request.on("row", row => {
        this.buffer.push(row);
      });

      request.query(this.sql);
    });
  }

  pushDataWhenAvailable() {
    if (this.buffer.length == 0) {
      if (this.readingDataFinished) return this.push(null);
      else setTimeout(this.pushDataWhenAvailable.bind(this), 100);
    } else {
      this.push(this.buffer.pop());
    }
  }
}

exports.createReadStream = options => {
  assert.ok(options.connectionUrl, "options.connectionUrl is required attribute");
  assert.ok(options.sql, "options.sql is required attribute");
  return new MSSQLReadStream(options);
};

class MSSQLWriteStream extends SQLWriteStream {
  createConnection(callback) {
    let connection = mssql.connect(this.connectionUrl, err => {
      if (err) return callback(err);
      this.connection = connection;
      callback(null, connection);
    });
  }
  closeConnection(callback) {
    this.connection.end();
    callback();
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
        value = mysql.escape(value);
        if (value === null) {
          value = "null";
        } else if (value && value.replace) {
          value = value.replace(/\\'/g, "''");
        }
        value = value.join(",");
        objectValues.push(value);
      });
      values.push(objectValues);
    });

    let sql = "MERGE " +
      mysql.escapeId(this.table) +
      " USING (VALUES(" +
      values.join("),(") +
      ")) AS foo(" +
      columns.join(",") +
      ") ON " +
      mysql.escapeId(this.table) +
      ".id = foo.id";
    let columnAssigns = [];
    for (i in columns) {
      columnAssigns.push(columns[i] + "=foo." + columns[i]);
    }
    sql += " WHEN MATCHED THEN UPDATE SET " + columnAssigns.join(",");
    sql += " WHEN NOT MATCHED THEN INSERT (" + columns.join(",") + ") VALUES(" + columns.join(",") + ");";
    return this.connection
      .query(sql)
      .then(() => {
        callback(null);
      })
      .catch(null);
  }
}

exports.createWriteStream = options => {
  return new MSSQLWriteStream(options);
};
