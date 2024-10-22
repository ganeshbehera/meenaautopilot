// routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Account = require('../models/Account');
const authenticateToken = require('../middleware/authMiddleware');
const cron = require('node-cron');

// Connect to Duplikium Cockpit Account
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post('https://www.trade-copier.com/webservice/v4/account/connectAccount.php', req.body, {
      headers: {
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error connecting to Duplikium API:', error);
    res.status(500).json({ error: 'Failed to connect to Duplikium account' });
  }
});

// Set Trading Status for Account (START/STOP)
router.post('/set-status/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { status } = req.body; // Expected value: 'start' or 'stop'

    const account = await Account.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(403).json({ error: 'Access forbidden: You do not own this account' });
    }

    // API call to update trading settings
    const response = await axios.post('https://www.trade-copier.com/webservice/v4/account/setSettings.php', {
      account_id: accountId,
      trading_status: status,
    }, {
      headers: {
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    res.status(200).json({ message: `Trading ${status} successfully`, data: response.data });
  } catch (error) {
    console.error('Error updating trading status:', error);
    res.status(500).json({ error: 'Failed to update trading status' });
  }
});

// Add a Slave Account
router.post('/addAccount', authenticateToken, async (req, res) => {
  try {
    const { broker, mtVersion, ...accountDetails } = req.body;

    // Validate broker type and MT version
    if (!['MultiBank', 'ICM', 'TMGM'].includes(broker) || !['MT4', 'MT5'].includes(mtVersion)) {
      return res.status(400).json({ error: 'Invalid broker or MT version' });
    }

    const response = await axios.post('https://www.trade-copier.com/webservice/v4/account/addAccount.php', accountDetails, {
      headers: {
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const accountData = response.data;

    // Save account to MongoDB
    const newAccount = new Account({
      accountId: accountData.account_id,
      login: accountData.login,
      server: accountData.server,
      broker,
      mtVersion,
      balance: accountData.balance,
      currency: accountData.currency,
      userId: req.user._id
    });
    await newAccount.save();

    res.status(200).json(accountData);
  } catch (error) {
    console.error('Error adding slave account:', error);
    res.status(500).json({ error: 'Failed to add slave account' });
  }
});

// Delete a Slave Account
router.delete('/deleteAccount/:accountId', authenticateToken, async (req, res) => {
  const { accountId } = req.params;
  try {
    const response = await axios.post('https://www.trade-copier.com/webservice/v4/account/deleteAccount.php', { account_id: accountId }, {
      headers: {
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Delete account from MongoDB
    await Account.deleteOne({ accountId, userId: req.user._id });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error deleting slave account:', error);
    res.status(500).json({ error: 'Failed to delete slave account' });
  }
});

// Get Accounts from MongoDB
router.get('/', authenticateToken, async (req, res) => {
  try {
    let accounts;
    if (req.user.role === 'admin') {
      accounts = await Account.find(); // Admin can see all accounts
    } else {
      accounts = await Account.find({ userId: req.user._id }); // Users see only their accounts
    }
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Update Account Settings
router.put('/updateAccount/:accountId', authenticateToken, async (req, res) => {
  const { accountId } = req.params;
  try {
    const response = await axios.post('https://www.trade-copier.com/webservice/v4/account/updateAccount.php', { account_id: accountId, ...req.body }, {
      headers: {
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Update account in MongoDB
    await Account.updateOne({ accountId, userId: req.user._id }, req.body);

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account settings' });
  }
});

// Schedule Report Generation for an Account
router.post('/schedule-report', authenticateToken, async (req, res) => {
  try {
    const { accountId, interval } = req.body; // Interval like '0 0 * * *' for daily

    // Schedule report generation using cron
    cron.schedule(interval, async () => {
      try {
        const account = await Account.findOne({ _id: accountId, userId: req.user._id });
        if (!account) {
          console.error(`Access forbidden for account: ${accountId}`);
          return;
        }
        // Logic to generate report for the account
        console.log(`Generating scheduled report for account: ${accountId}`);
        // Call existing report generation logic here...
      } catch (err) {
        console.error('Error during scheduled report generation:', err);
      }
    });

    res.status(200).json({ message: 'Report schedule set successfully' });
  } catch (error) {
    console.error('Error scheduling report:', error);
    res.status(500).json({ error: 'Failed to schedule report' });
  }
});

module.exports = router;