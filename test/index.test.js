'use strict';

const assert = require('assert');
const mysql = require('mysql');

const mysqlStreams = require('../lib/mysql');
const mssqlStreams = require('../lib/mssql');
const handler = require('../lib/transfer');

const fixtures = require('./fixtures');

let pipeInTestDB = (select, table, callback) => {
  let read = mysqlStreams.createReadStream({
    connectionUrl: 'mysql://root:test@localhost/test',
    sql: select
  });
  let write = mysqlStreams.createWriteStream({
    connectionUrl: 'mysql://root:test@localhost/test',
    table: table,
    maxSQLRetries: 1
  });

  write.on('finish', function() {
    callback();
  });

  read.on('error', callback);
  write.on('error', callback);

  read.pipe(write);
};

let checkTableEquality = (tableName1, tablename2, callback) => {
  let connection = mysql.createConnection('mysql://root:test@localhost/test');
  connection.query(
    `SELECT (SELECT COUNT(*) from ${tableName1}) as count1, (SELECT COUNT(*) from ${tablename2}) as count2`,
    (err, result) => {
      assert.equal(result[0].count1, result[0].count2);
      connection.end();
      callback();
    }
  );
};
let getRows = tableName => {
  return new Promise((resolve, reject) => {
    let connection = mysql.createConnection('mysql://root:test@localhost/test');
    connection.query(`SELECT * FROM ${tableName}`, (err, result) => {
      if (err) reject(err);
      connection.end();
      resolve(result);
    });
  });
};

describe('handler', () => {
  beforeEach(() => {
    return fixtures.prepare();
  });

  it('should pipe users -> users2 and finish', done => {
    pipeInTestDB('SELECT * FROM users', 'users2', () => {
      checkTableEquality('users', 'users2', done);
    });
  });

  it('test', done => {
    let sql = `SELECT
        id,
        username,
        firstname,
        lastname,
        birthdate
        FROM users
      `;
    handler({
      sourceUrl: 'mysql://root:test@localhost/test',
      sourceSQL: sql,
      destinationUrl: 'mysql://root:test@localhost/test',
      destinationTable: 'users2'
    })
      .then(() => {
        return checkTableEquality('users', 'users2', done);
      })
      .catch(done);
  });

  it('should be able to pipe users -> users2 and finish multiple times', done => {
    pipeInTestDB('SELECT * FROM users', 'users2', err => {
      assert.ok(!err, 'did fail with error ' + (err ? err.message : ''));
      pipeInTestDB('SELECT * FROM users', 'users2', err => {
        assert.ok(!err, 'did fail with error ' + (err ? err.message : ''));
        pipeInTestDB('SELECT * FROM users', 'users2', err => {
          assert.ok(!err, 'did fail with error ' + (err ? err.message : ''));
          checkTableEquality('users', 'users2', done);
        });
      });
    });
  });

  it('should pipe cars -> anothercars and finish', done => {
    pipeInTestDB(
      'SELECT name as name2, brand as branding FROM cars',
      'anothercars',
      err => {
        assert.ok(!err, 'did fail with error ' + (err ? err.message : ''));
        checkTableEquality('cars', 'anothercars', done);
      }
    );
  });

  it('should fail to insert to nonexisting table', done => {
    pipeInTestDB(
      'SELECT name as name2, brand as branding FROM cars',
      'blahfoo',
      err => {
        assert.ok(err.message.indexOf('ER_NO_SUCH_TABLE:') !== -1);
        done();
      }
    );
  });

  it('should use csv as data source', () => {
    return handler({
      sourceUrl: 'csv://' + __dirname + '/test.csv',
      destinationUrl: 'mysql://root:test@localhost/test',
      destinationTable: 'users2'
    })
      .then(() => {
        return getRows('users2');
      })
      .then(users => {
        assert.equal(users.length, 2);
        assert.equal(users[0].username, 'john.doe');
      });
  });
});
