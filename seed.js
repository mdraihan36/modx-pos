require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing in .env file!");
  process.exit(1);
}

// HTTP over Port 443 (100% Firewall/Timeout Safe)
const sql = neon(process.env.DATABASE_URL);

const seedData = async () => {
  try {
    console.log('Connecting to Neon Cloud via HTTPS Port 443...');

    // টেবিল ইনিশিয়ালাইজ
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        barcode VARCHAR(100),
        cost_price NUMERIC(10, 2) NOT NULL,
        selling_price NUMERIC(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 5
      );
    `;

    // প্রোডাক্ট ইনসার্ট
    await sql`
      INSERT INTO products (name, barcode, cost_price, selling_price, stock, min_stock)
      VALUES 
        ('Engine Oil 10W-30 (Mobil 1L)', 'OIL-10W30-01', 520, 650, 24, 5),
        ('Disc Brake Pad (Front Dual Piston)', 'BRK-PAD-02', 320, 450, 18, 4),
        ('High Flow Air Filter (Racing Spec)', 'FLT-AIR-03', 400, 550, 3, 5),
        ('Laser Iridium Spark Plug', 'IGN-SPK-04', 280, 380, 35, 8),
        ('Heavy Duty Drive Chain Set (O-Ring)', 'DRV-CHN-05', 2200, 2850, 4, 3)
      ON CONFLICT DO NOTHING;
    `;

    console.log('Demo Products & Tables Successfully Initialized in Neon DB via HTTP!');
  } catch (err) {
    console.error('Seeding Error:', err);
  } finally {
    process.exit();
  }
};

seedData();