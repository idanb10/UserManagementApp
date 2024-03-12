require('dotenv').config();

const { getConnection } = require('./dbConfig');

async function testDatabaseConnection() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM Users');
    console.log('Successfully connected to the database!');
    console.log(result.recordset); 
  } catch (err) {
    console.error('Database connection failed:', err);
    return; 
  }
}

testDatabaseConnection();