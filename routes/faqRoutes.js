const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const authenticateToken = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

// Get FAQs from MongoDB
router.get('/', authenticateToken, async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Add FAQ (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const newFAQ = new FAQ(req.body);
    await newFAQ.save();
    res.status(201).json(newFAQ);
  } catch (error) {
    console.error('Error adding FAQ:', error);
    res.status(500).json({ error: 'Failed to add FAQ' });
  }
});

module.exports = router;
