require('dotenv').config();
const { Pool } = require('pg');

let pool = null;
let isCloudConnected = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 10
  });
}

const initDB = async () => {
  if (!pool) {
    console.log('⚠️ Running in Local Offline Memory Mode (No DATABASE_URL)');
    return;
  }

  let client;
  try {
    client = await pool.connect();
    console.log(' Connected to PostgreSQL Database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        branch_id INT REFERENCES branches(id) ON DELETE SET NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        phone VARCHAR(20) UNIQUE NOT NULL,
        loyalty_points INT DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        sku VARCHAR(100),
        category VARCHAR(100) DEFAULT 'Lubricants',
        cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        reseller_base_price NUMERIC(10, 2) DEFAULT 0,
        selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
        supplier_name VARCHAR(150),
        supplier_phone VARCHAR(50),
        quantity INT NOT NULL,
        purchase_price NUMERIC(10, 2) NOT NULL,
        total_cost NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS job_cards (
        id SERIAL PRIMARY KEY,
        bike_number VARCHAR(50) NOT NULL,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        service_type VARCHAR(100),
        mechanic_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Queued',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50),
        order_type VARCHAR(50) DEFAULT 'direct',
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        bike_number VARCHAR(50),
        total_amount NUMERIC(10, 2) NOT NULL,
        paid_amount NUMERIC(10, 2) NOT NULL,
        total_cogs NUMERIC(10, 2) DEFAULT 0,
        profit NUMERIC(10, 2) DEFAULT 0,
        payment_method VARCHAR(100),
        items_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        company VARCHAR(150),
        phone VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL,
        payout_method VARCHAR(50),
        payout_account VARCHAR(100),
        total_supplied NUMERIC(10, 2) DEFAULT 0,
        total_paid NUMERIC(10, 2) DEFAULT 0,
        current_due NUMERIC(10, 2) DEFAULT 0,
        total_earned_profit NUMERIC(10, 2) DEFAULT 0,
        paid_profit NUMERIC(10, 2) DEFAULT 0,
        pending_payout NUMERIC(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_transactions (
        id SERIAL PRIMARY KEY,
        partner_id INT REFERENCES partners(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        description TEXT,
        amount NUMERIC(10, 2) NOT NULL,
        trx_ref VARCHAR(100),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS courier_deliveries (
        id SERIAL PRIMARY KEY,
        courier_name VARCHAR(50) NOT NULL,
        tracking_code VARCHAR(100) NOT NULL,
        recipient_name VARCHAR(100) NOT NULL,
        recipient_phone VARCHAR(20) NOT NULL,
        recipient_address TEXT NOT NULL,
        cod_amount NUMERIC(10, 2) DEFAULT 0,
        delivery_status VARCHAR(50) DEFAULT 'In Transit',
        reseller_page VARCHAR(100) DEFAULT 'Direct Sale',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fb_orders (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(100) NOT NULL,
        customer_name VARCHAR(150),
        customer_phone VARCHAR(50),
        delivery_address TEXT,
        items_ordered TEXT,
        order_status VARCHAR(50) DEFAULT 'Pending Review',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    isCloudConnected = true;
    console.log(' All Database Tables Initialized Successfully');
  } catch (err) {
    console.error('⚠️ Database Initialization Error:', err.message);
  } finally {
    if (client) client.release();
  }
};

module.exports = { pool, initDB, isCloudConnected };