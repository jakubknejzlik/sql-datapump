"use strict";

const Writable = require("flushwritable");
const mysql = require("mysql");
const async = require("async");

class SQLWriteStream extends Writable {
  constructor(options) {
    options.objectMode = true;
    super(options);
    this.connectionUrl = options.connectionUrl;
    this.table = options.table;

    this.buffer = [];
    this.maxBufferSize = options.highWaterMark || 1000;
    this.maxSQLRetries = 5;
    this.error = null;

    let handler = async.retryable(
      {
        times: this.maxSQLRetries,
        interval: function(retryCount) {
          return 50 * Math.pow(2, retryCount);
        }
      },
      (task, callback) => {
        this._insertWithRetry(task.objects, callback);
      }
    );
    this.queue = async.queue(handler, 10);
  }

  _write(object, encoding, callback) {
    this.buffer.push(object);
    if (this.maxBufferSize > this.buffer.length) return callback(this.error);
    this.processBuffer(() => {
      callbback(this.error);
    });
  }

  _flush(callback) {
    this.processBuffer(err => {
      if (this.queue.length() === 0)
        return this._close(() => {
          callback(this.error);
        });
      this.queue.drain = () => {
        this._close(() => {
          callback(this.error);
        });
      };
    });
  }

  _close(callback) {
    this.closeConnection(callback);
  }

  processBuffer(callback) {
    if (!this.connection) {
      this.createConnection(() => {
        this.processBuffer(callback);
      });
      return;
    }
    if (this.buffer.length === 0) return callback();
    let objects = this.buffer;
    this.buffer = [];

    this.queue.push({ objects: objects });
    callback();
  }

  _insertWithRetry(objects, callback) {
    let _this = this;
    // console.log('inserting objects',objects.length)
    this.insertObjects(objects, (err, data) => {
      if (err && err.code !== "ER_LOCK_DEADLOCK")
        console.log("received error: ", err.message);
      _this.error = err;
      callback(err, data);
    });
    // this.insertObjects(objects,(err) => {
    //   if (err && attempt < this.maxSQLRetries) {
    //     console.log('retrying insert, received error: ', err.message)
    //     return this._insertWithRetry(objects, attempt + 1, callback)
    //   }
    //   callback(err)
    // })
  }

  createConnection() {
    throw new Error("createConnection not implemented");
  }

  closeConnection() {
    throw new Error("closeConnection not implemented");
  }

  insertObjects(objects, callback) {
    throw new Error("insertObjects not implemented");
  }
}

module.exports = SQLWriteStream;
