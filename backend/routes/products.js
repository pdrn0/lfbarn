const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// PUBLIC: list active products
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let q = 'SELECT * FROM products WHERE active = true';
    const params = [];
    if (category) { q += ' AND category = $1'; params.push(category); }
    q += ' ORDER BY created_at DESC';
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUBLIC: track view
router.post('/:id/view', async (req, res) => {
  try {
    const { creative } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await db.query('UPDATE products SET views = views + 1 WHERE id = $1', [req.params.id]);
    await db.query(
      "INSERT INTO events (product_id, event_type, creative, ip) VALUES ($1, 'view', $2, $3)",
      [req.params.id, creative || null, ip]
    );
    res.json({ ok: true });
  } catch (err) { res.json({ ok: false }); }
});

// PUBLIC: track order (whatsapp click)
router.post('/:id/order', async (req, res) => {
  try {
    const { creative } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await db.query('UPDATE products SET orders = orders + 1 WHERE id = $1', [req.params.id]);
    await db.query(
      "INSERT INTO events (product_id, event_type, creative, ip) VALUES ($1, 'order', $2, $3)",
      [req.params.id, creative || null, ip]
    );
    res.json({ ok: true });
  } catch (err) { res.json({ ok: false }); }
});

// ADMIN: list all products
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: create product
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, creative } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const whatsapp_link = `https://wa.me/5544999769485?text=Olá!%20Tenho%20interesse%20no%20produto:%20${encodeURIComponent(name)}`;
    const result = await db.query(
      'INSERT INTO products (name, description, price, category, creative, image_url, whatsapp_link) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description, price || null, category, creative || null, image_url, whatsapp_link]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: update product
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, creative, active } = req.body;
    const existing = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const image_url = req.file ? `/uploads/${req.file.filename}` : existing.rows[0].image_url;
    const whatsapp_link = `https://wa.me/5544999769485?text=Olá!%20Tenho%20interesse%20no%20produto:%20${encodeURIComponent(name)}`;
    const result = await db.query(
      'UPDATE products SET name=$1, description=$2, price=$3, category=$4, creative=$5, image_url=$6, whatsapp_link=$7, active=$8 WHERE id=$9 RETURNING *',
      [name, description, price || null, category, creative || null, image_url, whatsapp_link, active !== 'false', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
