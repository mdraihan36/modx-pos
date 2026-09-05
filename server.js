require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { pool, initDB } = require('./db');

// সঠিক CommonJS সিনট্যাক্সে জেমিনি লোড করা
const pkg = require('@google/genai');
const ai = new pkg.GoogleGenAI({});

const app = express();

app.use(cors());
app.use(express.json());

initDB();

// ১. পেজ রিলোডে ডাটাবেজ থেকে সমস্ত ডাটা একবারে নিয়ে আসা
app.get('/api/bootstrap-data', async (req, res) => {
  try {
    if (!pool) return res.json({});
    const products = await pool.query('SELECT * FROM products ORDER BY id DESC');
    const invoices = await pool.query('SELECT * FROM invoices ORDER BY id DESC LIMIT 100');
    const purchases = await pool.query('SELECT * FROM purchases ORDER BY id DESC LIMIT 100');
    const expenses = await pool.query('SELECT * FROM expenses ORDER BY id DESC LIMIT 100');
    const jobCards = await pool.query('SELECT * FROM job_cards ORDER BY id DESC');
    const partners = await pool.query('SELECT * FROM partners ORDER BY id DESC');
    const suppliers = await pool.query('SELECT * FROM suppliers ORDER BY id DESC');
    
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
    
    let returnLogs = { rows: [] };
    try {
      returnLogs = await pool.query(`
        SELECT r.*, pr.name AS product_name 
        FROM returns r 
        LEFT JOIN products pr ON r.product_id = pr.id 
        ORDER BY r.id DESC LIMIT 100
      `);
    } catch (e) {}

    res.json({
      products: products.rows,
      invoices: invoices.rows,
      purchases: purchases.rows,
      expenses: expenses.rows,
      jobCards: jobCards.rows,
      dealers: partners.rows.filter(p => p.role === 'DEALER'),
      resellers: partners.rows.filter(p => p.role === 'RESELLER'),
      suppliers: suppliers.rows,
      dealerTransactions: partnerTx.rows.filter(t => t.type === 'SALE' || t.type === 'PAYMENT'),
      payoutLogs: partnerTx.rows.filter(t => t.type === 'PAYOUT'),
      deliveries: deliveries.rows,
      fbOrders: fbOrders.rows,
      returns: returnLogs.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ২. ক্যাটাগরি রাউট
app.get('/api/categories', async (req, res) => {
  try {
    if (!pool) return res.json([]);
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });
  try {
    if (!pool) return res.json({ success: true, category: { name } });
    const { rows } = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name.trim()]
    );
    res.json({ success: true, category: rows[0] || { name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৩. নতুন পার্টনার তৈরি (Reseller / Dealer)
app.post('/api/partners/add', async (req, res) => {
  const { name, company, phone, role, payout_method, payout_account } = req.body;
  if (!name || !phone || !role) return res.status(400).json({ error: 'Name, Phone and Role required' });
  try {
    if (!pool) return res.json({ success: true });
    const { rows } = await pool.query(
      `INSERT INTO partners (name, company, phone, role, payout_method, payout_account)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, company || '', phone, role.toUpperCase(), payout_method || 'bKash', payout_account || '']
    );
    res.json({ success: true, partner: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৪. নতুন সাপ্লায়ার তৈরি
app.post('/api/suppliers/add', async (req, res) => {
  const { name, phone, company } = req.body;
  if (!name) return res.status(400).json({ error: 'Supplier name required' });
  try {
    if (!pool) return res.json({ success: true });
    const { rows } = await pool.query(
      `INSERT INTO suppliers (name, phone, company) VALUES ($1, $2, $3) RETURNING *`,
      [name, phone || '', company || '']
    );
    res.json({ success: true, supplier: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৫. পণ্য যুক্ত করার ব্যাকএন্ড রুট
app.post('/api/products/add', async (req, res) => {
  const { name, sku, category, cost_price, reseller_base_price, selling_price, stock, supplier_name } = req.body;
  if (!name || !cost_price || !selling_price || !stock) {
    return res.status(400).json({ error: 'Missing required product fields' });
  }
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

// ৬. কুরিয়ার পার্সেল বুকিং ও স্ট্যাটাস আপডেট
app.post('/api/deliveries/add', async (req, res) => {
  const { courier_name, tracking_code, recipient_name, recipient_phone, recipient_address, cod_amount, reseller_page } = req.body;
  try {
    if (!pool) return res.json({ success: true });
    const { rows } = await pool.query(
      `INSERT INTO courier_deliveries (courier_name, tracking_code, recipient_name, recipient_phone, recipient_address, cod_amount, reseller_page)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [courier_name, tracking_code, recipient_name, recipient_phone, recipient_address, cod_amount || 0, reseller_page || 'Direct Sale']
    );
    res.json({ success: true, delivery: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/deliveries/:id', async (req, res) => {
  const { id } = req.params;
  const { delivery_status } = req.body;
  try {
    if (!pool) return res.json({ success: true });
    const { rows } = await pool.query(
      'UPDATE courier_deliveries SET delivery_status = $1 WHERE id = $2 RETURNING *',
      [delivery_status, id]
    );
    res.json({ success: true, delivery: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৭. ফেসবুক মেসেঞ্জার অর্ডার স্ট্যাটাস
app.patch('/api/facebook-orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!pool) return res.json({ success: true });
    const { rows } = await pool.query(
      'UPDATE fb_orders SET order_status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json({ success: true, order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৮. পণ্য রিটার্ন হ্যান্ডলার
app.post('/api/returns', async (req, res) => {
  const { return_type, reference_id, product_id, quantity, refund_amount, reason } = req.body;
  if (!return_type || !product_id || !quantity) {
    return res.status(400).json({ error: 'Return type, Product and Quantity required' });
  }
  if (!pool) return res.json({ success: true });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const retRes = await client.query(
      `INSERT INTO returns (return_type, reference_id, product_id, quantity, refund_amount, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [return_type, reference_id || 'N/A', product_id, quantity, refund_amount || 0, reason || '']
    );

    if (return_type === 'SALE_RETURN') {
      await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, product_id]);
    } else if (return_type === 'PURCHASE_RETURN') {
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, product_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, returnRecord: retRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ৯. ইনভয়েস তৈরি
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

// ১০. ইউনিভার্সাল সার্চ
app.get('/api/search-history', async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) return res.status(400).json({ error: 'Search query required' });
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

// ১১. খরচ
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

// ১২. জব কার্ড
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

// Facebook Webhook & Gemini AI Chatbot
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'modx_secret_bot_token';

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
    res.status(200).send('EVENT_RECEIVED');

    for (const entry of body.entry) {
      const webhookEvent = entry.messaging?.[0];
      if (!webhookEvent) continue;
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        const userMsg = webhookEvent.message.text.trim();

        try {
          let productListContext = "আমাদের দোকানে বর্তমানে কোনো পণ্য তালিকাভুক্ত নেই।";
          if (pool) {
            const prodRes = await pool.query('SELECT name, selling_price, stock, category FROM products');
            if (prodRes.rows.length > 0) {
              productListContext = prodRes.rows.map(p => 
                `- ${p.name} (${p.category}): দাম Tk ${p.selling_price}, স্টক আছে ${p.stock} পিস`
              ).join('\n');
            }
          }

          const systemInstruction = `
            তুমি ModX Bike Mart-এর একজন ফ্রেন্ডলি ও প্রফেশনাল এআই সেলস অ্যাসিস্ট্যান্ট। 
            তোমার কাজ হলো কাস্টমারের মেসেজের উত্তর দেওয়া, পার্টসের দাম বা স্টক সম্পর্কে জানানো এবং বাইক পার্টস বিক্রি করা।
            আমাদের দোকানের বর্তমান পণ্যের তালিকা এবং স্টক নিচে দেওয়া হলো:
            ${productListContext}

            নিয়মাবলী:
            - কাস্টমার যে পণ্যের দাম বা স্টক জানতে চাইবে, উপরোক্ত তালিকা দেখে সঠিক দাম ও স্টক জানাবে।
            - কাস্টমার পার্টস কিনতে চাইলে বা অর্ডার কনফার্ম করতে চাইলে তার নাম, মোবাইল নম্বর এবং ডেলিভারির ঠিকানা চাইবে।
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMsg,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });

          const botReply = response.text || "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না।";
          await sendTextMessage(senderId, botReply);

        } catch (botErr) {
          console.error('Gemini Bot Error:', botErr.message);
          await sendTextMessage(senderId, "দুঃখিত, একটু টেকনিক্যাল সমস্যা হচ্ছে। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।");
        }
      }
    }
  } else {
    res.sendStatus(404);
  }
});

// Serve Frontend Build
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

app.get(/^(?!\/api|\/webhook).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});