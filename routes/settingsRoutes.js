// routes/settingsRoutes.js
const express = require('express');
const axios = require('axios');
const Settings = require('../models/Settings');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Get Settings from Trade Copier API
router.get('/getSettings', authenticateToken, async (req, res) => {
  try {
    // The base URL for getting settings from the Trade Copier API
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/settings/getSettings.php';
    
    // Define the headers for authentication
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Auth-Username': process.env.AUTH_USERNAME,
      'Auth-Token': process.env.AUTH_TOKEN,
    };

    // Extract filter parameters from request (optional)
    const { id_slave, id_master, id_group } = req.query;
    const requestData = new URLSearchParams();
    if (id_slave) requestData.append('id_slave', id_slave);
    if (id_master) requestData.append('id_master', id_master);
    if (id_group) requestData.append('id_group', id_group);

    // Make the request to Trade Copier API
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: headers,
    });

    // Handle success response from Trade Copier API
    if (response.data && response.data.settings) {
      const settings = response.data.settings;

      // Save or update settings in MongoDB
      for (const setting of settings) {
        await Settings.findOneAndUpdate(
          { id_master: setting.id_master, id_slave: setting.id_slave, id_group: setting.id_group },
          setting,
          { upsert: true, new: true }
        );
      }

      return res.status(200).json(settings);
    } else {
      // If response doesn't have the expected structure
      return res.status(400).json({ error: 'Failed to retrieve settings from Trade Copier API', details: response.data });
    }
  } catch (error) {
    console.error('Error fetching settings:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

module.exports = router;
