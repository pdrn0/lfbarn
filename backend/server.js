require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Static files (frontend)
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB init
const db = require('./db');
db.init();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/metrics', require('./routes/metrics'));

// Admin SPA
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/admin.html'));
});

// Catch-all → index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(PORT, () => console.log(`LF Barn running on port ${PORT}`));
