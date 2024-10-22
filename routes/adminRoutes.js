// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Account = require('../models/Account');
const Report = require('../models/Report');
const axios = require('axios');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeAdmin = require('../middleware/adminMiddleware');
const cron = require('node-cron');

dotenv.config();

// Get all users (Admin only)
router.get('/users', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user (Admin only)
router.post('/users', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete a user by ID (Admin only)
router.delete('/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all activity logs (Admin only)
router.get('/activity-logs', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate('userId', 'username email');
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Delete an account by ID (Admin only)
router.delete('/accounts/:accountId', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { accountId } = req.params;
    await Account.findByIdAndDelete(accountId);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Generate a report for an account (Admin only)
router.post('/generate-report', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { accountId, reportType, startDate, endDate } = req.body;

    // API call to Duplikium's Trade Copier service for report generation
    const response = await axios.post('https://www.trade-copier.com/webservice/v4/account/getReporting.php', {
      account_id: accountId,
      report_type: reportType,
      start_date: startDate,
      end_date: endDate
    }, {
      headers: {
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Save the generated report to the database
    const newReport = new Report({
      accountId,
      reportType,
      generatedBy: req.user._id,
      startDate,
      endDate,
      reportData: response.data
    });
    await newReport.save();

    // Return the saved report
    res.status(200).json(newReport);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// View all reports for an account (Admin only)
router.get('/view-reports/:accountId', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Fetch all reports for the account
    const reports = await Report.find({ accountId });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Scheduled Report Generation (Admin-level for all accounts)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running admin-level scheduled report generation job...');

    // Fetch all accounts for generating admin reports
    const accounts = await Account.find();

    for (const account of accounts) {
      const response = await axios.post('https://www.trade-copier.com/webservice/v4/account/getReporting.php', {
        account_id: account.accountId,
        report_type: 'admin_daily', // Example report type for admins
        start_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday's date
        end_date: new Date().toISOString() // Today's date
      }, {
        headers: {
          'Auth-Username': process.env.AUTH_USERNAME,
          'Auth-Token': process.env.AUTH_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Save the generated report to the database
      const newReport = new Report({
        accountId: account._id,
        reportType: 'admin_daily',
        generatedBy: 'admin',
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(),
        reportData: response.data
      });
      await newReport.save();
    }

    console.log('Admin daily reports generated successfully');
  } catch (error) {
    console.error('Error during admin-level scheduled report generation:', error);
  }
});

module.exports = router;
