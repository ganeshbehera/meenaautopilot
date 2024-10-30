// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Account = require('../models/Account');
const Report = require('../models/Report');
const authenticateToken = require('../middleware/authMiddleware');
const dotenv = require('dotenv');
dotenv.config();

// Retrieve Monthly Reports (User specific)
router.post('/getMonthlyReport', authenticateToken, async (req, res) => {
  try {
    const { month, year, account_ids, start, length } = req.body;

    // Define the base URL for fetching the report
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/reporting/getReporting.php';

    // Define the headers for authentication
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Auth-Username': process.env.AUTH_USERNAME,
      'Auth-Token': process.env.AUTH_TOKEN,
    };

    // Prepare request data
    const requestData = new URLSearchParams();
    if (month !== undefined) requestData.append('month', month);
    if (year !== undefined) requestData.append('year', year);
    if (start !== undefined) requestData.append('start', start);
    if (length !== undefined) requestData.append('length', length);
    if (account_ids) {
      if (Array.isArray(account_ids)) {
        requestData.append('account_id', account_ids.join(','));
      } else {
        requestData.append('account_id', account_ids);
      }
    }

    // Make the POST request to fetch report data
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: headers,
    });

    if (response.data && response.data.reporting) {
      // Save each report in the database
      const savedReports = [];
      for (const report of response.data.reporting) {
        const newReport = new Report({
          accountId: report.login,
          month: report.month,
          year: report.year,
          name: report.name,
          broker: report.broker,
          login: report.login,
          server: report.server,
          currency: report.currency,
          hwm: report.hwm,
          balance_start: report.balance_start,
          deposit_withdrawal: report.deposit_withdrawal,
          balance_end: report.balance_end,
          pnl: report.pnl,
          performance: report.performance,
          accountStatus: report.accountStatus,
          accountType: report.accountType,
        });
        await newReport.save();
        savedReports.push(newReport);
      }
      res.status(200).json(savedReports);
    } else {
      res.status(404).json({ error: 'No reports found for the given parameters' });
    }
  } catch (error) {
    console.error('Error fetching monthly reports:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch monthly reports' });
  }
});

// View all reports for an account (User specific)
router.get('/view/:accountId', authenticateToken, async (req, res) => {
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

// Scheduled Report Generation (Example: Monthly on the 1st)
cron.schedule('0 0 1 * *', async () => {
  try {
    console.log('Running monthly report generation job...');

    // Fetch all accounts for which reports should be generated
    const accounts = await Account.find(); // Adjust the condition as needed (e.g., active accounts only)

    for (const account of accounts) {
      // Define the base URL for fetching the report
      const apiUrl = 'https://www.trade-copier.com/webservice/v4/reporting/getReporting.php';
      
      // Prepare request data for the last month report
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const month = previousMonth.getMonth() + 1; // JS months are 0-indexed
      const year = previousMonth.getFullYear();
      const requestData = new URLSearchParams();
      requestData.append('month', month);
      requestData.append('year', year);
      requestData.append('account_id', account.accountId);

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Auth-Username': process.env.AUTH_USERNAME,
        'Auth-Token': process.env.AUTH_TOKEN,
      };

      // Make the POST request to fetch the monthly report
      const response = await axios.post(apiUrl, requestData.toString(), { headers });

      if (response.data && response.data.reporting) {
        for (const report of response.data.reporting) {
          const newReport = new Report({
            accountId: report.login,
            month: report.month,
            year: report.year,
            name: report.name,
            broker: report.broker,
            login: report.login,
            server: report.server,
            currency: report.currency,
            hwm: report.hwm,
            balance_start: report.balance_start,
            deposit_withdrawal: report.deposit_withdrawal,
            balance_end: report.balance_end,
            pnl: report.pnl,
            performance: report.performance,
            accountStatus: report.accountStatus,
            accountType: report.accountType,
          });
          await newReport.save();
        }
      }
    }

    console.log('Monthly reports generated successfully');
  } catch (error) {
    console.error('Error during scheduled report generation:', error);
  }
});

module.exports = router;
