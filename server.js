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

// Get Products
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT *, (stock <= min_stock) AS is_low_stock FROM products ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ১. নতুন প্রোডাক্ট অ্যাড এবং সাপ্লায়ার পারচেস এন্ট্রি
app.post('/api/products/add', async (req, res) => {
  const { name, sku, cost_price, selling_price, stock, supplier_name, supplier_phone } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let supplierId = null;
    if (supplier_name) {
      const supRes = await client.query(
        `INSERT INTO suppliers (name, phone) VALUES ($1, $2) RETURNING id`,
        [supplier_name, supplier_phone || '']
      );
      supplierId = supRes.rows[0].id;
    }

    const prodRes = await client.query(
      `INSERT INTO products (name, barcode, cost_price, selling_price, stock, min_stock)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, sku || 'SKU-' + Date.now(), cost_price, selling_price, stock, 5]
    );
    const product = prodRes.rows[0];

    await client.query(
      `INSERT INTO purchases (product_id, supplier_id, quantity, purchase_price, total_cost)
       VALUES ($1, $2, $3, $4, $5)`,
      [product.id, supplierId, stock, cost_price, Number(cost_price) * Number(stock)]
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

// ২. খরচ (Expense) রেকর্ড করা
app.post('/api/expenses', async (req, res) => {
  const { title, category, amount } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO expenses (title, category, amount) VALUES ($1, $2, $3) RETURNING *`,
      [title, category, amount]
    );
    res.json({ success: true, expense: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৩. সেলস, এক্সপেন্স, কার থেকে কেনা হয়েছে এবং প্রফিট অ্যানালিটিক্স
app.get('/api/analytics', async (req, res) => {
  try {
    const salesRes = await pool.query('SELECT COALESCE(SUM(paid_amount), 0) AS total_sales FROM invoices');
    const expenseRes = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses');
    const purchaseRes = await pool.query(`
      SELECT p.id, pr.name AS product_name, s.name AS supplier_name, s.phone AS supplier_phone,
             p.quantity, p.purchase_price, p.total_cost, p.created_at
      FROM purchases p
      LEFT JOIN products pr ON p.product_id = pr.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.id DESC
    `);
    const totalInventoryCostRes = await pool.query('SELECT COALESCE(SUM(total_cost), 0) AS total_cogs FROM purchases');

    const totalSales = Number(salesRes.rows[0].total_sales);
    const totalExpenses = Number(expenseRes.rows[0].total_expenses);
    const totalCogs = Number(totalInventoryCostRes.rows[0].total_cogs);
    const netProfit = totalSales - (totalCogs * 0.6) - totalExpenses;

    res.json({
      total_sales: totalSales,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      purchase_history: purchaseRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Facebook Webhook & Chatbot Setup ---

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'modx_secret_bot_token';
const userSessions = {};

// Facebook Messenger Webhook Verification
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

// চ্যাটবট স্টেট মেশিন
app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        const userMsg = webhookEvent.message.text.trim();
        if (!userSessions[senderId]) userSessions[senderId] = { step: 0, orderData: {} };
        const session = userSessions[senderId];

        switch (session.step) {
          case 0:
            await sendTextMessage(senderId, "স্বাগতম ModX Bike Mart-এ! 🏍️\nআপনি কোন পার্টস বা এক্সেসরিজটি অর্ডার করতে চান?");
            session.step = 1;
            break;
          case 1:
            session.orderData.items = userMsg;
            await sendTextMessage(senderId, "ধন্যবাদ! আপনার পূর্ণ নাম (Full Name) লিখুন:");
            session.step = 2;
            break;
          case 2:
            session.orderData.name = userMsg;
            await sendTextMessage(senderId, "আপনার মোবাইল নম্বরটি দিন:");
            session.step = 3;
            break;
          case 3:
            session.orderData.phone = userMsg;
            await sendTextMessage(senderId, "কুরিয়ার ডেলিভারির জন্য আপনার পূর্ণ ঠিকানা (জেলা ও থানা সহ) দিন:");
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
              await sendTextMessage(senderId, `আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! ✅\nআইটেম: ${session.orderData.items}\nফোন: ${session.orderData.phone}\nখুব শীঘ্রই আমাদের টিম কল করে কনফার্ম করবে।`);
            } catch (err) {
              await sendTextMessage(senderId, "অর্ডার সংরক্ষণে সমস্যা হয়েছে, দয়া করে আবার চেষ্টা করুন।");
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

// Facebook Orders List
app.get('/api/facebook-orders', async (req, res) => {
  try {
    if (!pool) return res.json([]);
    const { rows } = await pool.query(`SELECT * FROM fb_orders ORDER BY id DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Facebook Order Status Update (Approve)
app.patch('/api/facebook-orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE fb_orders SET order_status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SERVE FRONTEND BUILD ----------------
// frontend/build ফোল্ডার স্ট্যাটিক ফাইল হিসেবে সার্ভ করা
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// অন্য সব রিকোয়েস্টে সরাসরি ফ্রন্টএন্ড UI ওপেন হবে (Express 5/path-to-regexp সেইফ ফরম্যাট)
app.get(/^(?!\/api|\/webhook).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});