const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0
});

const promisePool = pool.promise();

// Expose both query and getConnection
promisePool.getConnection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) return reject(err);
      const promiseConnection = connection.promise();
      promiseConnection.release = () => connection.release();
      resolve(promiseConnection);
    });
  });
};

module.exports = promisePool;