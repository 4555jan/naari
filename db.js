const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'janvi', // replace with your root password
  database: 'ecommerce',
  connectionLimit: 10
});

module.exports = pool;
