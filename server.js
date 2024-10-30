// server.js
const express = require('express');
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
const PORT = process.env.PORT || 3200;

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
const accountRoutes = require('./routes/accountRoutes');
const faqRoutes = require('./routes/faqRoutes');
const adminRoutes = require('./routes/adminRoutes');
const backtestRoutes = require('./routes/backtestRoutes');
const authRoutes = require('./routes/authRoutes'); // Added auth routes for user authentication
const profileRoutes = require('./routes/profileRoutes');
const positionRoutes = require('./routes/positionsRoutes'); // Added profile routes for user profile management

// Use route modules
app.use('/api/v1/accounts', authenticateToken, accountRoutes);
app.use('/api/v1/faqs', authenticateToken, faqRoutes);
app.use('/api/v1/admin', authenticateToken, authorizeAdmin, adminRoutes);
app.use('/api/v1/backtest', authenticateToken, backtestRoutes);
app.use('/api/v1/auth', authRoutes); // Authentication routes for sign-up, sign-in, reset password
app.use('/api/v1/profile', authenticateToken, profileRoutes); 
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/positions', authenticateToken, positionRoutes); // User profile management routes

// General error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app._router.stack.forEach((middleware) => {
  if (middleware.route) { // If it is a route
    console.log(`${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') { // If it is a router
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(`${Object.keys(handler.route.methods)[0].toUpperCase()} ${handler.route.path}`);
      }
    });
  }
});