const mysql = require('mysql2/promise');
require('dotenv').config();
const db = require('./db');

async function setup() {
  console.log('🔧 Setting up MySQL database...\n');

  try {
    // Step 1: Create the database if it doesn't exist
    console.log('📚 Checking/Creating database...');
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
    });

    const dbName = process.env.DB_NAME || 'timetable_db';
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' is ready`);
    await tempPool.end();

    // Step 2: Create tables and seed users via db.init()
    console.log('📋 Creating tables...');
    await db.init();

    console.log('\n✅ Database setup complete!\n');
    console.log('You can now run: npm start');
    console.log('To migrate existing JSON data, run: npm run migrate\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Access denied')) {
      console.error('\n⚠️  Credentials incorrect. Update your .env file with the correct MySQL password.');
    }
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  MySQL is not running. Start MySQL service first.');
    }
    process.exit(1);
  }

  process.exit(0);
}

setup();
