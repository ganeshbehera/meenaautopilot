// routes/positionsRoutes.js
const express = require('express');
const axios = require('axios');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

// Get Closed Positions from Trade Copier API
router.post('/getClosedPositions', authenticateToken, async (req, res) => {
  try {
    // Define the base URL for fetching closed positions from the Trade Copier API
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/position/getClosedPositions.php';

    // Define the headers for authentication
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Auth-Username': process.env.AUTH_USERNAME,
      'Auth-Token': process.env.AUTH_TOKEN,
    };

    // Get filters from request body, if any
    const { from, to, account_type, start, length, show_off } = req.body;

    // Prepare the request data for filtering
    const requestData = new URLSearchParams();
    if (from) requestData.append('from', from);
    if (to) requestData.append('to', to);
    if (account_type) requestData.append('account_type', account_type); // 0 = master, 1 = slave
    if (start) requestData.append('start', start);
    if (length) requestData.append('length', length);
    if (show_off) requestData.append('show_off', show_off); // Include inactive accounts

    // Make the POST request to get closed positions
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: headers,
    });

    // Check if the response contains data
    if (response.data && response.data.data) {
      res.status(200).json(response.data.data);
    } else {
      res.status(404).json({ error: 'No closed positions found' });
    }
  } catch (error) {
    console.error('Error fetching closed positions:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch closed positions' });
  }
});

// Get Open Positions from Trade Copier API
router.post('/getOpenPositions', authenticateToken, async (req, res) => {
  try {
    // Define the base URL for fetching open positions from the Trade Copier API
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/position/getOpenPositions.php';

    // Define the headers for authentication
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Auth-Username': process.env.AUTH_USERNAME,
      'Auth-Token': process.env.AUTH_TOKEN,
    };

    // Get filters from request body, if any
    const { from, to, account_type, start, length, show_off } = req.body;

    // Prepare the request data for filtering
    const requestData = new URLSearchParams();
    if (from) requestData.append('from', from);
    if (to) requestData.append('to', to);
    if (account_type) requestData.append('account_type', account_type); // 0 = master, 1 = slave
    if (start) requestData.append('start', start);
    if (length) requestData.append('length', length);
    if (show_off) requestData.append('show_off', show_off); // Include inactive accounts

    // Make the POST request to get open positions
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: headers,
    });

    // Check if the response contains data
    if (response.data && response.data.data) {
      res.status(200).json(response.data.data);
    } else {
      res.status(404).json({ error: 'No open positions found' });
    }
  } catch (error) {
    console.error('Error fetching open positions:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch open positions' });
  }
});

module.exports = router;
