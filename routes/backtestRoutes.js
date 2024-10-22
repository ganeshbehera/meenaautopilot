const express = require('express');
const router = express.Router();
const Backtest = require('../models/Backtest');
const authenticateToken = require('../middleware/authMiddleware');

// Create a new backtest
router.post('/', authenticateToken, async (req, res) => {
  try {
    const backtest = new Backtest({
      userId: req.user._id,
      strategy: req.body.strategy,
      parameters: req.body.parameters,
      result: req.body.result, // In a real scenario, you would generate this result
    });
    await backtest.save();
    res.status(201).json(backtest);
  } catch (error) {
    console.error('Error creating backtest:', error);
    res.status(500).json({ error: 'Failed to create backtest' });
  }
});

// Get all backtests for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const backtests = await Backtest.find({ userId: req.user._id });
    res.status(200).json(backtests);
  } catch (error) {
    console.error('Error fetching backtests:', error);
    res.status(500).json({ error: 'Failed to fetch backtests' });
  }
});

module.exports = router;
