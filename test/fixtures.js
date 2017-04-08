"use strict";

const fs = require("fs");
const mysql = require("mysql");
const Promise = require("bluebird");

let createArray = n => {
  var data = [];
  for (var i = 0; i < n; i++) {
    data.push(i);
  }
  return data;
};

exports.prepare = () => {
  let connection = Promise.promisifyAll(
    mysql.createConnection("mysql://root:test@localhost/test?multipleStatements=1")
  );

  let sql = fs.readFileSync(__dirname + "/fixtures.sql", "utf-8");
  return connection
    .queryAsync(sql)
    .then(() => {
      return Promise.map(
        createArray(1),
        x => {
          // console.log('creating batch',x)
          let values = [];

          for (let i = 0; i < 1000; i++) {
            values.push(
              `('user_${x}_${i}','firstname_${x}_${i}','lastname_${x}_${i}','1980-01-01' + INTERVAL ${i} DAY)`
            );
          }

          let insert = "INSERT INTO `users` (`username`,`firstname`,`lastname`,`birthdate`) VALUES " + values.join(",");
          return connection.queryAsync(insert);
        },
        { concurrency: 5 }
      );
    })
    .then(() => {
      let values = [];

      for (let i = 0; i < 10000; i++) {
        values.push(`('my car ${i}','chevy ${i}')`);
      }

      let insert = "INSERT INTO `cars` (`name`,`brand`) VALUES " + values.join(",");
      return connection.queryAsync(insert);
    });
};
