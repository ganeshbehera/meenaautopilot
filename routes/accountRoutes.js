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

// Add a Slave Account and Set Default Risk Settings
router.post('/addAccount', async (req, res) => {
  try {
    // Destructure and validate required fields
    const requiredFields = ['type', 'name', 'broker', 'login', 'password', 'server', 'environment', 'status', 'subscription'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Prepare request data for Trade Copier API
    const requestData = new URLSearchParams();
    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        requestData.append(key, value);
      }
    });

    // Make a POST request to Trade Copier API to add the account
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/account/addAccount.php';
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
      },
      responseType: 'json',
    });

    const responseData = response.data;

    // Handle the API response
    if (responseData.error) {
      // API returned an error
      console.error('API Error:', responseData.error);
      return res.status(400).json({ error: responseData.error });
    }

    let accountData;

    if (responseData.account) {
      accountData = responseData.account;
    } else if (responseData.details && responseData.details.account) {
      accountData = responseData.details.account;
    } else if (responseData.accounts && responseData.accounts.length > 0) {
      accountData = responseData.accounts[0];
    } else {
      // Unexpected response
      console.error('Unexpected API Response:', responseData);
      return res.status(400).json({
        error: 'Failed to add account due to unexpected response',
        details: responseData,
      });
    }

    // Handle empty or missing fields in accountData
    accountData.environment = accountData.environment || req.body.environment || 'Demo';
    accountData.broker = accountData.broker || req.body.broker;

    // Map API data to match your schema
    const newAccount = new Account({
      accountId: accountData.account_id,
      type: accountData.type,
      name: accountData.name,
      broker: accountData.broker.toLowerCase(),
      login: accountData.login,
      password: accountData.password,
      server: accountData.server,
      environment: accountData.environment,
      status: accountData.status,
      group: accountData.groupid || undefined,
      subscription: accountData.subscription_key,
      pending: accountData.pending,
      stop_loss: accountData.stop_loss,
      take_profit: accountData.take_profit,
      comment: accountData.comment,
      alert_email: accountData.alert_email,
      alert_sms: accountData.alert_sms,
      access_token: accountData.access_token,
      refresh_token: accountData.refresh_token,
      expiry_token: accountData.expiry_token,
      account: accountData.account,
      balance: accountData.balance,
      currency: accountData.ccy,
      lastUpdate: accountData.lastUpdate,
    });

    // Save the account data to MongoDB
    await newAccount.save();

    // Send success response
    return res.status(200).json({
      message: 'Account added and saved successfully',
      account_id: accountData.account_id,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error('Validation error when saving account:', error);
      return res.status(400).json({ error: 'Validation error when saving account', details: error.errors });
    } else {
      console.error('Error adding account:', error);
      return res.status(500).json({ error: 'An error occurred while adding the account' });
    }
  }
});

// Delete a Slave Account
router.delete('/deleteAccount/:accountId', authenticateToken, async (req, res) => {
  const { accountId } = req.params;

  try {
    // API URL for deleting an account
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/account/deleteAccount.php';

    // Prepare the request data
    const requestData = new URLSearchParams();
    requestData.append('account_id', accountId);

    // Send the request to the Trade Copier API to delete the account
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
      },
    });

    // Handle successful response from API
    if (response.data && response.data.account) {
      // Delete account from MongoDB (using `accountId` and `userId`)
      await Account.deleteOne({ accountId, userId: req.user._id });
      return res.status(200).json({ message: `Account ${response.data.account.account_id} has been deleted successfully!` });
    } else {
      // If response structure doesn't match expected, send a failure response
      return res.status(400).json({ error: 'Failed to delete account from Trade Copier API', details: response.data });
    }
  } catch (error) {
    console.error('Error deleting slave account:', error.response ? error.response.data : error.message);
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
    // Step 1: Prepare request data for Trade Copier API
    const requestData = new URLSearchParams();
    requestData.append('account_id', accountId);

    // Append all other fields that might need updating
    for (let key in req.body) {
      if (req.body.hasOwnProperty(key) && req.body[key] !== undefined && req.body[key] !== null) {
        requestData.append(key, req.body[key]);
      }
    }

    // Step 2: Make the external API call to the Trade Copier service
    const response = await axios.post(
      'https://www.trade-copier.com/webservice/v4/account/updateAccount.php',
      requestData.toString(),
      {
        headers: {
          'Auth-Username': process.env.AUTH_USERNAME,
          'Auth-Token': process.env.AUTH_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Step 3: Check for successful response
    if (response.data && response.data.account) {
      // Successfully updated in Trade Copier, now update MongoDB

      // Extract relevant account fields from the response (if needed)
      const updatedAccountData = {
        ...req.body, // Include what user sent to update
        lastUpdate: new Date().toISOString(), // Optionally update last modified timestamp
      };

      // Step 4: Update the MongoDB Account
      const updatedAccount = await Account.updateOne(
        { accountId, userId: req.user._id },
        updatedAccountData
      );

      if (updatedAccount.nModified === 0) {
        return res.status(404).json({ error: 'No account found to update or nothing was changed' });
      }

      // Step 5: Send success response
      res.status(200).json({ message: 'Account updated successfully in both Trade Copier and MongoDB', account: response.data.account });
    } else {
      // Handle case where the update to Trade Copier failed but did not throw an error
      return res.status(400).json({
        error: 'Failed to update account in Trade Copier. Check the account details and try again.',
        details: response.data,
      });
    }
  } catch (error) {
    // Step 6: Handle errors gracefully
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account settings in Trade Copier or MongoDB' });
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


router.post('/getAccounts', authenticateToken, async (req, res) => {
  const { account_id } = req.body; // Optional account ID filter

  try {
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/account/getAccounts.php';
    const requestData = new URLSearchParams();
    if (account_id) {
      if (Array.isArray(account_id)) {
        account_id.forEach(id => requestData.append('account_id[]', id));
      } else {
        requestData.append('account_id', account_id);
      }
    }

    // Make the external API request
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
      },
    });

    if (response.data && response.data.accounts) {
      // Example of saving to MongoDB
      const accounts = response.data.accounts;

      // Save or update each account in MongoDB
      for (let account of accounts) {
        await Account.findOneAndUpdate(
          { accountId: account.account_id },
          { ...account },
          { upsert: true, new: true }
        );
      }

      res.status(200).json(accounts);
    } else {
      res.status(400).json({
        error: 'Failed to fetch accounts from Trade Copier API',
        details: response.data,
      });
    }
  } catch (error) {
    console.error('Error fetching accounts:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while fetching accounts' });
  }
});

// Get an Account by ID
router.get('/:accountId', authenticateToken, async (req, res) => {
  const { accountId } = req.params;

  try {
    // Fetch the account from MongoDB
    const account = await Account.findOne({ accountId, userId: req.user._id });

    if (!account) {
      return res.status(404).json({ error: 'Account not found or access forbidden' });
    }

    // Return the account details
    res.status(200).json(account);
  } catch (error) {
    console.error('Error fetching account by ID:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

router.post('/apply-strategy/:accountId', authenticateToken, async (req, res) => {
  const { accountId } = req.params;
  const { algorithm, riskLevel, simultrades } = req.body;

  try {
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/account/setStrategy.php';
    const requestData = new URLSearchParams();
    requestData.append('account_id', accountId);
    requestData.append('algorithm', algorithm);
    requestData.append('risk_level', riskLevel);
    requestData.append('simultrades', simultrades);

    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
      },
    });

    // Send success response
    res.status(200).json({ message: 'Strategy applied successfully', data: response.data });
  } catch (error) {
    console.error('Error applying strategy:', error);
    res.status(500).json({ error: 'Failed to apply strategy' });
  }
});

router.put('/updateAccount', authenticateToken, async (req, res) => {
  const {
    account_id, // Mandatory
    type, // Optional
    name, // Optional
    broker, // Optional
    login, // Optional
    password, // Optional
    server, // Optional
    environment, // Optional
    status, // Optional
    group, // Optional
    subscription_key, // Optional
    pending, // Optional
    stop_loss, // Optional
    take_profit, // Optional
    comment, // Optional
    alert_email, // Optional
    alert_sms, // Optional
    alert_email_failed, // Optional
    alert_sms_failed // Optional
  } = req.body;

  try {
    // Check if account_id is provided
    if (!account_id) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Define the API endpoint for updating an account
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/account/updateAccount.php';

    // Prepare data for the API request
    const requestData = new URLSearchParams();
    requestData.append('account_id', account_id);

    // Append other optional fields if provided in the request body
    if (type !== undefined) requestData.append('type', type);
    if (name) requestData.append('name', name);
    if (broker) requestData.append('broker', broker);
    if (login) requestData.append('login', login);
    if (password) requestData.append('password', password);
    if (server) requestData.append('server', server);
    if (environment) requestData.append('environment', environment);
    if (status !== undefined) requestData.append('status', status);
    if (group) requestData.append('group', group);
    if (subscription_key) requestData.append('subscription_key', subscription_key);
    if (pending !== undefined) requestData.append('pending', pending);
    if (stop_loss !== undefined) requestData.append('stop_loss', stop_loss);
    if (take_profit !== undefined) requestData.append('take_profit', take_profit);
    if (comment) requestData.append('comment', comment);
    if (alert_email !== undefined) requestData.append('alert_email', alert_email);
    if (alert_sms !== undefined) requestData.append('alert_sms', alert_sms);
    if (alert_email_failed !== undefined) requestData.append('alert_email_failed', alert_email_failed);
    if (alert_sms_failed !== undefined) requestData.append('alert_sms_failed', alert_sms_failed);

    // Make a POST request to the API
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
      },
    });

    // Handle successful response
    if (response.data && response.data.account) {
      res.status(200).json({
        message: 'Account updated successfully',
        account: response.data.account,
      });
    } else {
      res.status(400).json({
        error: 'Failed to update account',
        details: response.data,
      });
    }
  } catch (error) {
    console.error('Error updating account:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while updating the account' });
  }
});


module.exports = router;