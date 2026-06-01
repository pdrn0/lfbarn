const router = require('express').Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [totals, topViewed, topOrdered, byCategory, byCreative] = await Promise.all([
      db.query('SELECT COUNT(*) as total_products, SUM(views) as total_views, SUM(orders) as total_orders FROM products WHERE active = true'),
      db.query('SELECT id, name, category, image_url, views, orders FROM products ORDER BY views DESC LIMIT 5'),
      db.query('SELECT id, name, category, image_url, views, orders FROM products ORDER BY orders DESC LIMIT 5'),
      db.query("SELECT category, COUNT(*) as products, SUM(views) as views, SUM(orders) as orders FROM products WHERE active=true GROUP BY category ORDER BY orders DESC"),
      db.query("SELECT creative, COUNT(*) as events, SUM(CASE WHEN event_type='order' THEN 1 ELSE 0 END) as orders, SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END) as views FROM events WHERE creative IS NOT NULL GROUP BY creative ORDER BY orders DESC"),
    ]);
    res.json({
      totals: totals.rows[0],
      topViewed: topViewed.rows,
      topOrdered: topOrdered.rows,
      byCategory: byCategory.rows,
      byCreative: byCreative.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
