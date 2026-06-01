const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        category VARCHAR(100),
        creative VARCHAR(100),
        image_url VARCHAR(500),
        whatsapp_link VARCHAR(500),
        active BOOLEAN DEFAULT true,
        views INTEGER DEFAULT 0,
        orders INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        creative VARCHAR(100),
        ip VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed default admin if not exists
    const bcrypt = require('bcryptjs');
    const existing = await client.query("SELECT id FROM admins WHERE email = 'admin@lfbarn.com'");
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('lfbarn2025', 10);
      await client.query(
        "INSERT INTO admins (email, password) VALUES ('admin@lfbarn.com', $1)",
        [hash]
      );
      console.log('Default admin created: admin@lfbarn.com / lfbarn2025');
    }

    // Seed sample products if empty
    const prods = await client.query("SELECT COUNT(*) FROM products");
    if (parseInt(prods.rows[0].count) === 0) {
      const samples = [
        ['Boné American Ranch', 'Boné original importado dos EUA, estilo ranch com bordado exclusivo.', 189.90, 'Lifestyle', 'criativo-1', null],
        ['Kit Pesca Bass Pro', 'Kit completo para pesca, original Bass Pro Shops EUA.', 349.90, 'Fishing', 'criativo-2', null],
        ['Bota Outdoor Wolverine', 'Bota couro legítimo, modelo clássico americano importado.', 899.90, 'Outdoor', 'criativo-1', null],
        ['Chapéu Ranch Resistol', 'Chapéu de cowboy original Resistol, importado direto dos EUA.', 649.90, 'Ranch', 'criativo-3', null],
      ];
      for (const [name, description, price, category, creative, image_url] of samples) {
        const wa = `https://wa.me/5544999769485?text=Olá!%20Tenho%20interesse%20no%20produto:%20${encodeURIComponent(name)}`;
        await client.query(
          "INSERT INTO products (name, description, price, category, creative, image_url, whatsapp_link, views, orders) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [name, description, price, category, creative, image_url, wa, Math.floor(Math.random()*80)+10, Math.floor(Math.random()*20)+1]
        );
      }
      console.log('Sample products seeded.');
    }

    console.log('Database initialized.');
  } catch (err) {
    console.error('DB init error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { pool, init, query: (text, params) => pool.query(text, params) };
