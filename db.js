require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 10
});

const initDB = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        branch_id INT REFERENCES branches(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        phone VARCHAR(20) UNIQUE NOT NULL,
        loyalty_points INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        barcode VARCHAR(100),
        cost_price NUMERIC(10, 2) NOT NULL,
        selling_price NUMERIC(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 5
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
        quantity INT NOT NULL,
        purchase_price NUMERIC(10, 2) NOT NULL,
        total_cost NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_cards (
        id SERIAL PRIMARY KEY,
        bike_number VARCHAR(50) NOT NULL,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        service_type VARCHAR(100),
        mechanic_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Queued',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        bike_number VARCHAR(50) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        paid_amount NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
        item_type VARCHAR(50),
        item_name VARCHAR(150),
        quantity INT,
        unit_price NUMERIC(10, 2),
        subtotal NUMERIC(10, 2)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
        payment_gateway VARCHAR(50),
        transaction_id VARCHAR(100),
        amount NUMERIC(10, 2),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL Tables Initialized Successfully');
  } catch (err) {
    console.error('Error initializing PostgreSQL tables:', err.message);
  } finally {
    if (client) client.release();
  }
};

module.exports = { pool, initDB };
require('dotenv').config();
const { Pool } = require('pg');

let pool = null;
let isCloudConnected = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });
}

const initDB = async () => {
  if (!pool) {
    console.log('⚠️ Running in Local Offline Memory Mode');
    return;
  }

  try {
    const client = await pool.connect();
    console.log(' Connected to Neon PostgreSQL Cloud Database');

    // ১. প্রোডাক্ট ক্যাটালগ টেবিল
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        barcode VARCHAR(100),
        cost_price NUMERIC(10, 2) NOT NULL,
        reseller_base_price NUMERIC(10, 2) NOT NULL,
        selling_price NUMERIC(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 5
      );
    `);

    // ২. পার্টনারস (ডিলার ও রিসেলার) টেবিল
    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        company VARCHAR(150),
        phone VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL, -- 'DEALER' or 'RESELLER'
        payout_method VARCHAR(50),
        payout_account VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ৩. পার্টনার লেনদেন লেজার
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_transactions (
        id SERIAL PRIMARY KEY,
        partner_id INT REFERENCES partners(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL, -- 'SALE' (মাল দেওয়া) or 'PAYMENT' (টাকা আদায়/পে-আউট)
        description TEXT,
        amount NUMERIC(10, 2) NOT NULL,
        trx_ref VARCHAR(100),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ৪. কুরিয়ার ডেলিভারি ট্র্যাকিং টেবিল
    await client.query(`
      CREATE TABLE IF NOT EXISTS courier_deliveries (
        id SERIAL PRIMARY KEY,
        invoice_id INT,
        courier_name VARCHAR(50) NOT NULL, -- 'Steadfast' or 'Sundarban'
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

    // ৫. ফেসবুক পেজ চ্যাটবট অর্ডার টেবিল
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

    client.release();
    isCloudConnected = true;
  } catch (err) {
    console.log('⚠️ Cloud DB Connection Error (Fallback Active):', err.message);
  }
};

module.exports = { pool, initDB, isCloudConnected };