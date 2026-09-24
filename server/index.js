import express from 'express';
import cors from 'cors';
import { getPool, testConnection } from './db.js';
import { initDatabase } from './init-db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inisialisasi DB saat server mulai
initDatabase();

// --- 1. Health & Connection Status ---
app.get('/api/status', async (_req, res) => {
  const result = await testConnection();
  res.json(result);
});

// --- 2. Auth Login Endpoint ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password, pin } = req.body;
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPin = (pin || password || '').trim();

  if (!cleanUsername || !cleanPin) {
    return res.status(400).json({ success: false, message: 'Username dan Password/PIN wajib diisi' });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = ? AND (pin = ? OR password = ?) AND active = 1',
      [cleanUsername, cleanPin, cleanPin]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau Password/PIN salah' });
    }

    const user = rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        active: Boolean(user.active),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 3. Customers Endpoints ---
app.get('/api/customers', async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { kode, name, phone, company, address, type } = req.body;
  try {
    const pool = getPool();
    const id = `CUST-${Date.now().toString().slice(-4)}`;
    await pool.query(
      'INSERT INTO customers (id, kode, name, phone, company, address, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, kode || '0000', name, phone, company || null, address || null, type || 'regular']
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. Materials & Products Endpoints ---
app.get('/api/materials', async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM materials ORDER BY group_item, name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materials', async (req, res) => {
  const { kode, name, group_item, unit, cost_price, selling_price, stock, description } = req.body;
  try {
    const pool = getPool();
    const id = `MAT-${Date.now().toString().slice(-4)}`;
    await pool.query(
      'INSERT INTO materials (id, kode, name, group_item, unit, cost_price, selling_price, stock, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, kode, name, group_item, unit || 'pcs', cost_price || 0, selling_price || 0, stock || 100, description || null]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. SPK Orders Endpoints (Full Master-Detail) ---
app.get('/api/spk', async (_req, res) => {
  try {
    const pool = getPool();
    const [orders] = await pool.query('SELECT * FROM spk_orders ORDER BY created_at DESC');
    const [items] = await pool.query('SELECT * FROM spk_items');

    // Group items by spk_id
    const result = orders.map((order) => ({
      ...order,
      items: items.filter((it) => it.spk_id === order.id),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/spk', async (req, res) => {
  const {
    no_spk,
    no_faktur,
    tgl_spk,
    design_pic,
    operator_pic,
    group_item,
    customer_kode,
    customer_nama,
    customer_telp,
    subtotal,
    diskon,
    ppn,
    total,
    bayar,
    sisa,
    payment_status,
    payment_method,
    work_status,
    priority,
    deadline,
    catatan_umum,
    created_by,
    items,
  } = req.body;

  try {
    const pool = getPool();
    const spkId = `SPK-ID-${Date.now()}`;

    // 1. Insert master SPK order
    await pool.query(
      `INSERT INTO spk_orders 
      (id, no_spk, no_faktur, tgl_spk, design_pic, operator_pic, group_item, customer_kode, customer_nama, customer_telp, subtotal, diskon, ppn, total, bayar, sisa, payment_status, payment_method, work_status, priority, deadline, catatan_umum, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        spkId,
        no_spk,
        no_faktur,
        tgl_spk,
        design_pic || 'MARGIN',
        operator_pic || null,
        group_item || 'INDOOR',
        customer_kode || '0000',
        customer_nama,
        customer_telp || '-',
        subtotal || 0,
        diskon || 0,
        ppn || 0,
        total || 0,
        bayar || 0,
        sisa || 0,
        payment_status || 'paid',
        payment_method || 'cash',
        work_status || 'pending',
        priority || 'normal',
        deadline || null,
        catatan_umum || null,
        created_by || 'Admin',
      ]
    );

    // 2. Insert items
    if (items && Array.isArray(items)) {
      for (const it of items) {
        const itemId = `ITEM-${Date.now()}-${Math.random().toString().slice(-4)}`;
        await pool.query(
          `INSERT INTO spk_items 
          (id, spk_id, kode, item_name, file_name, qty, p, l, area_m2, unit_price, subtotal, catatan)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            spkId,
            it.kode || '0000',
            it.item_name || it.productName || 'Item Cetak',
            it.file_name || it.fileName || null,
            it.qty || 1,
            it.p || it.lengthM || null,
            it.l || it.widthM || null,
            it.area_m2 || it.areaM2 || null,
            it.unit_price || it.unitPrice || 0,
            it.subtotal || 0,
            it.catatan || it.notes || null,
          ]
        );
      }
    }

    res.json({ success: true, id: spkId, no_spk });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update SPK status / payment
app.put('/api/spk/:id/status', async (req, res) => {
  const { id } = req.params;
  const { work_status, bayar, sisa, payment_status } = req.body;
  try {
    const pool = getPool();
    await pool.query(
      'UPDATE spk_orders SET work_status = COALESCE(?, work_status), bayar = COALESCE(?, bayar), sisa = COALESCE(?, sisa), payment_status = COALESCE(?, payment_status) WHERE id = ?',
      [work_status, bayar, sisa, payment_status, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 6. Expenses Endpoints ---
app.get('/api/expenses', async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY tgl DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { no_bukti, kategori, deskripsi, amount, tgl, created_by, payment_method, notes } = req.body;
  try {
    const pool = getPool();
    const id = `EXP-${Date.now().toString().slice(-4)}`;
    await pool.query(
      'INSERT INTO expenses (id, no_bukti, kategori, deskripsi, amount, tgl, created_by, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, no_bukti, kategori, deskripsi, amount, tgl || new Date(), created_by || 'Admin', payment_method || 'cash', notes || null]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 7. Store Settings Endpoints ---
app.get('/api/settings', async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM store_settings LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  const { store_name, tagline, phone, whatsapp, email, address, city, bank_accounts, footer_receipt, footer_spk } = req.body;
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE store_settings SET 
      store_name = ?, tagline = ?, phone = ?, whatsapp = ?, email = ?, address = ?, city = ?, bank_accounts = ?, footer_receipt = ?, footer_spk = ?
      WHERE id = 1`,
      [
        store_name,
        tagline,
        phone,
        whatsapp,
        email,
        address,
        city,
        typeof bank_accounts === 'string' ? bank_accounts : JSON.stringify(bank_accounts),
        footer_receipt,
        footer_spk,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
// --- 8. Users Management Endpoints ---
app.get('/api/users', async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, username, pin, name, role, phone, active, created_at FROM users ORDER BY role, name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, pin, password, name, role, phone } = req.body;
  try {
    const pool = getPool();
    const id = `USR-${Date.now().toString().slice(-4)}`;
    await pool.query(
      'INSERT INTO users (id, username, password, pin, name, role, phone, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [id, username.toLowerCase(), password || pin, pin, name, role || 'admin', phone || null]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, pin, password, name, role, phone, active } = req.body;
  try {
    const pool = getPool();
    await pool.query(
      'UPDATE users SET username = ?, pin = ?, password = COALESCE(?, pin), name = ?, role = ?, phone = ?, active = ? WHERE id = ?',
      [username.toLowerCase(), pin, password, name, role, phone || null, active !== undefined ? (active ? 1 : 0) : 1, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CetakPro POS Backend API berjalan pada http://localhost:${PORT}`);
});
