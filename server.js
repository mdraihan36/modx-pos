// ১. সমস্ত তথ্য ডাটাবেজ থেকে একবারে নিয়ে আসা (Page Refresh Load)
app.get('/api/bootstrap-data', async (req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products ORDER BY id DESC');
    const invoices = await pool.query('SELECT * FROM invoices ORDER BY id DESC LIMIT 100');
    const purchases = await pool.query('SELECT * FROM purchases ORDER BY id DESC LIMIT 100');
    const expenses = await pool.query('SELECT * FROM expenses ORDER BY id DESC LIMIT 100');
    const jobCards = await pool.query('SELECT * FROM job_cards ORDER BY id DESC');
    const partners = await pool.query('SELECT * FROM partners ORDER BY id DESC');
    const partnerTx = await pool.query('SELECT pt.*, p.name as partner_name FROM partner_transactions pt JOIN partners p ON pt.partner_id = p.id ORDER BY pt.id DESC LIMIT 100');
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const invRes = await client.query(
      `INSERT INTO invoices (invoice_number, order_type, customer_name, customer_phone, bike_number, total_amount, paid_amount, total_cogs, profit, payment_method, items_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [invoice_number, order_type, customer_name, customer_phone, bike_number, total_amount, paid_amount, total_cogs, profit, payment_method, JSON.stringify(items)]
    );

    for (const item of items) {
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
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

// ৩. ইউনিভার্সাল সার্চ (ফোন নম্বর বা বাইক নম্বর দিয়ে সকল রিপোর্ট বের করা)
app.get('/api/search-history', async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) return res.status(400).json({ error: 'সার্চ কিওয়ার্ড দিন' });
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

    const partnerLedger = await pool.query(
      `SELECT p.name, p.role, p.phone, pt.* FROM partners p 
       JOIN partner_transactions pt ON p.id = pt.partner_id 
       WHERE p.phone ILIKE $1 OR p.name ILIKE $1 ORDER BY pt.id DESC`,
      [searchPattern]
    );

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

// ৫. জব কার্ড তৈরি ও স্ট্যাটাস আপডেট
app.post('/api/workshop/jobcard', async (req, res) => {
  const { bike_number, customer_name, customer_phone, service_type, mechanic_name } = req.body;
  try {
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
    const { rows } = await pool.query('UPDATE job_cards SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json({ success: true, job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ৬. খরচ এন্ট্রি
app.post('/api/expenses', async (req, res) => {
  const { title, category, amount } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO expenses (title, category, amount) VALUES ($1, $2, $3) RETURNING *',
      [title, category, amount]
    );
    res.json({ success: true, expense: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});