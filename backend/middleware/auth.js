const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'lfbarn_secret_2025';

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token required' });
  }
  try {
    req.admin = jwt.verify(auth.split(' ')[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
