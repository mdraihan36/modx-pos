require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { pool, initDB } = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database Tables
initDB();

// ---------------- API ROUTES ----------------

// ১. পেজ রিলোডে ডাটাবেজ থেকে সমস্ত ডাটা একবারে নিয়ে আসা
app.get('/api/bootstrap-data', async (req, res) => {
  try {
    if (!pool) return res.json({});
    const products = await pool.query('SELECT * FROM products ORDER BY id DESC');
    const invoices = await pool.query('SELECT * FROM invoices ORDER BY id DESC LIMIT 100');
    const purchases = await pool.query('SELECT * FROM purchases ORDER BY id DESC LIMIT 100');
    const expenses = await pool.query('SELECT * FROM expenses ORDER BY id DESC LIMIT 100');
    const jobCards = await pool.query('SELECT * FROM job_cards ORDER BY id DESC');
    const partners = await pool.query('SELECT * FROM partners ORDER BY id DESC');
    
    let partnerTx = { rows: [] };
    try {
      partnerTx = await pool.query(`
        SELECT pt.*, p.name as partner_name 
        FROM partner_transactions pt 
        JOIN partners p ON pt.partner_id = p.id 
        ORDER BY pt.id DESC LIMIT 100
      `);
    } catch (e) {}

    const deliveries = await pool.query('SELECT * FROM courier_deliveries ORDER BY id DESC');
    const fbOrders = await pool.query('SELECT * FROM fb_orders ORDER BY id DESC');

    res.json({
      products: products.rows,
      invoices: invoices.rows,
      purchases: purchases.rows,
      expenses: expenses.rows,
      jobCards: jobCards.rows,
      dealers: partners.rows.filter(p => p.role === 'DEALER'),
      resellers: partners.rows.filter(p => p.role === 'RESELLER'),
      dealerTransactions: partnerTx.rows.filter(t => t.type === 'SALE' || t.type === 'PAYMENT'),
      payoutLogs: partnerTx.rows.filter(t => t.type === 'PAYOUT'),
      deliveries: deliveries.rows,
      fbOrders: fbOrders.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ২. ইনভয়েস তৈরি এবং স্টক স্বয়ংক্রিয়ভাবে আপডেট
app.post('/api/invoices/create', async (req, res) => {
  const { invoice_number, order_type, customer_name, customer_phone, bike_number, items, total_amount, paid_amount, total_cogs, profit, payment_method } = req.body;
  if (!pool) return res.json({ success: true, offline: true });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const invRes = await client.query(
      `INSERT INTO invoices (invoice_number, order_type, customer_name, customer_phone, bike_number, total_amount, paid_amount, total_cogs, profit, payment_method, items_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [invoice_number, order_type, customer_name, customer_phone, bike_number, total_amount, paid_amount, total_cogs, profit, payment_method, JSON.stringify(items)]
    );

    if (Array.isArray(items)) {
      for (const item of items) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, invoice: invRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ৩. ইউনিভার্সাল সার্চ (ফোন নম্বর বা বাইক নম্বর দিয়ে সকল রিপোর্ট খোঁজা)
app.get('/api/search-history', async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) return res.status(400).json({ error: 'সার্চ কিওয়ার্ড দিন' });
  if (!pool) return res.json({ success: true, invoices: [], workshopJobs: [], fbOrders: [], supplierPurchases: [], partnerLedger: [] });

  const searchPattern = `%${query}%`;
  try {
    const customerInvoices = await pool.query(
      `SELECT * FROM invoices WHERE customer_phone ILIKE $1 OR bike_number ILIKE $1 ORDER BY id DESC`,
      [searchPattern]
    );

    const workshopJobs = await pool.query(
      `SELECT * FROM job_cards WHERE bike_number ILIKE $1 OR customer_phone ILIKE $1 ORDER BY id DESC`,
      [searchPattern]
    );

    const fbOrders = await pool.query(
      `SELECT * FROM fb_orders WHERE customer_phone ILIKE $1 ORDER BY id DESC`,
      [searchPattern]
    );

    const supplierPurchases = await pool.query(
      `SELECT * FROM purchases WHERE supplier_phone ILIKE $1 OR supplier_name ILIKE $1 ORDER BY id DESC`,
      [searchPattern]
    );

    let partnerLedger = { rows: [] };
    try {
      partnerLedger = await pool.query(
        `SELECT p.name, p.role, p.phone, pt.* FROM partners p 
         JOIN partner_transactions pt ON p.id = pt.partner_id 
         WHERE p.phone ILIKE $1 OR p.name ILIKE $1 ORDER BY pt.id DESC`,
        [searchPattern]
      );
    } catch (e) {}

    res.json({
      success: true,
      query,
      invoices: customerInvoices.rows,
      workshopJobs: workshopJobs.rows,
      fbOrders: fbOrders.rows,
      supplierPurchases: supplierPurchases.rows,
      partnerLedger: partnerLedger.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৪. পণ্য যুক্ত করার ব্যাকএন্ড রুট
app.post('/api/products/add', async (req, res) => {
  const { name, sku, category, cost_price, reseller_base_price, selling_price, stock, supplier_name } = req.body;
  if (!pool) return res.json({ success: true, offline: true });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pRes = await client.query(
      `INSERT INTO products (name, sku, category, cost_price, reseller_base_price, selling_price, stock, min_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 5) RETURNING *`,
      [name, sku, category, cost_price, reseller_base_price, selling_price, stock]
    );
    const product = pRes.rows[0];

    await client.query(
      `INSERT INTO purchases (product_id, supplier_name, supplier_phone, quantity, purchase_price, total_cost)
       VALUES ($1, $2, 'N/A', $3, $4, $5)`,
      [product.id, supplier_name || 'Direct Wholesale', stock, cost_price, Number(cost_price) * Number(stock)]
    );

    await client.query('COMMIT');
    res.json({ success: true, product });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ৫. খরচ (Expenses)
app.post('/api/expenses', async (req, res) => {
  const { title, category, amount } = req.body;
  try {
    if (!pool) return res.json({ success: true, offline: true });
    const { rows } = await pool.query(
      'INSERT INTO expenses (title, category, amount) VALUES ($1, $2, $3) RETURNING *',
      [title, category, amount]
    );
    res.json({ success: true, expense: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৬. জব কার্ড (Workshop)
app.post('/api/workshop/jobcard', async (req, res) => {
  const { bike_number, customer_name, customer_phone, service_type, mechanic_name } = req.body;
  try {
    if (!pool) return res.json({ success: true, offline: true });
    const { rows } = await pool.query(
      `INSERT INTO job_cards (bike_number, customer_name, customer_phone, service_type, mechanic_name, status)
       VALUES ($1, $2, $3, $4, $5, 'Queued') RETURNING *`,
      [bike_number, customer_name, customer_phone, service_type, mechanic_name]
    );
    res.json({ success: true, job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/workshop/jobcard/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!pool) return res.json({ success: true, offline: true });
    const { rows } = await pool.query('UPDATE job_cards SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json({ success: true, job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Facebook Webhook & Chatbot Setup ---
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'modx_secret_bot_token';
const userSessions = {};

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

const sendTextMessage = async (senderId, text) => {
  try {
    await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      recipient: { id: senderId },
      message: { text }
    });
  } catch (err) {
    console.error('FB Send Error:', err.response?.data || err.message);
  }
};

app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging?.[0];
      if (!webhookEvent) continue;
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        const userMsg = webhookEvent.message.text.trim();
        if (!userSessions[senderId]) userSessions[senderId] = { step: 0, orderData: {} };
        const session = userSessions[senderId];

        switch (session.step) {
          case 0:
            await sendTextMessage(senderId, "স্বাগতম ModX Bike Mart-এ!\nকোন পার্টস বা এক্সেসরিজটি অর্ডার করতে চান?");
            session.step = 1;
            break;
          case 1:
            session.orderData.items = userMsg;
            await sendTextMessage(senderId, "আপনার পূর্ণ নাম লিখুন:");
            session.step = 2;
            break;
          case 2:
            session.orderData.name = userMsg;
            await sendTextMessage(senderId, "আপনার মোবাইল নম্বরটি দিন:");
            session.step = 3;
            break;
          case 3:
            session.orderData.phone = userMsg;
            await sendTextMessage(senderId, "কুরিয়ার ডেলিভারির পূর্ণ ঠিকানা দিন:");
            session.step = 4;
            break;
          case 4:
            session.orderData.address = userMsg;
            try {
              if (pool) {
                await pool.query(
                  `INSERT INTO fb_orders (sender_id, customer_name, customer_phone, delivery_address, items_ordered)
                   VALUES ($1, $2, $3, $4, $5)`,
                  [senderId, session.orderData.name, session.orderData.phone, session.orderData.address, session.orderData.items]
                );
              }
              await sendTextMessage(senderId, `অর্ডার সফলভাবে গ্রহণ করা হয়েছে!\nআইটেম: ${session.orderData.items}\nফোন: ${session.orderData.phone}`);
            } catch (err) {
              await sendTextMessage(senderId, "অর্ডার সংরক্ষণে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।");
            }
            delete userSessions[senderId];
            break;
          default:
            delete userSessions[senderId];
            break;
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// ---------------- SERVE FRONTEND BUILD ----------------
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

app.get(/^(?!\/api|\/webhook).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});