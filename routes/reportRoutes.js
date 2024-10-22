// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Account = require('../models/Account');
const Report = require('../models/Report');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

// Generate a report for an account (User specific)
router.post('/generate', async (req, res) => {
  try {
    const { accountId, reportType, startDate, endDate } = req.body;

    // Validate that the requesting user owns the account
    const account = await Account.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(403).json({ error: 'Access forbidden: You do not own this account' });
    }

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

// View all reports for an account (User specific)
router.get('/view/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    // Validate that the requesting user owns the account
    const account = await Account.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return res.status(403).json({ error: 'Access forbidden: You do not own this account' });
    }

    // Fetch all reports for the account
    const reports = await Report.find({ accountId });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Scheduled Report Generation (Example: Daily at midnight)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily report generation job...');

    // Fetch all accounts for which reports should be generated
    const accounts = await Account.find(); // Adjust the condition as needed (e.g., active accounts only)

    for (const account of accounts) {
      const response = await axios.post('https://www.trade-copier.com/webservice/v4/account/getReporting.php', {
        account_id: account.accountId,
        report_type: 'daily', // Example report type
        start_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday's date
        end_date: new Date().toISOString() // Today's date
      }, {
        headers: {
          'Auth-Username': process.env.AUTH_USERNAME,
          'Auth-Token': process.env.AUTH_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Save each generated report to the database
      const newReport = new Report({
        accountId: account._id,
        reportType: 'daily',
        generatedBy: account.userId,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(),
        reportData: response.data
      });
      await newReport.save();
    }

    console.log('Daily reports generated successfully');
  } catch (error) {
    console.error('Error during scheduled report generation:', error);
  }
});

module.exports = router;