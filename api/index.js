const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cron = require('node-cron');

dotenv.config();

if (!process.env.MONGO_URI || !process.env.ACCESS_TOKEN_SECRET) {
  console.error('ERROR: Missing required environment variables');
  process.exit(1);
}

const app = express();

// Set 'trust proxy' to true to properly handle proxy headers
app.set('trust proxy', true); // <-- Add this line

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Security middleware
app.use(helmet()); // Adds various security headers to the response
app.use(cors()); // Enables CORS for all routes
app.use(express.json()); // Parses incoming JSON requests
app.use(morgan('combined')); // Logs requests to the console

// Token authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Role-Based Access Control Middleware
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: Admins only' });
  }
  next();
};

// Import route modules
const accountRoutes = require('../routes/accountRoutes');
const faqRoutes = require('../routes/faqRoutes');
const adminRoutes = require('../routes/adminRoutes');
const backtestRoutes = require('../routes/backtestRoutes');
const authRoutes = require('../routes/authRoutes');
const profileRoutes = require('../routes/profileRoutes');
const positionRoutes = require('../routes/positionsRoutes');

// Use route modules
app.use('/api/v1/accounts', authenticateToken, accountRoutes);
app.use('/api/v1/faqs', authenticateToken, faqRoutes);
app.use('/api/v1/admin', authenticateToken, authorizeAdmin, adminRoutes);
app.use('/api/v1/backtest', authenticateToken, backtestRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', authenticateToken, profileRoutes);
app.use('/api/v1/positions', authenticateToken, positionRoutes);

// General error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export the server as a handler for Vercel
module.exports = serverless(app);
