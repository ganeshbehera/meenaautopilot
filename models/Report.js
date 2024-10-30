// models/Report.js
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  accountId: { type: String, required: true },  // Account identifier from the Trade Copier API
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  name: String,
  broker: String,
  login: String,
  server: String,
  currency: String,
  hwm: Number,
  balance_start: Number,
  deposit_withdrawal: Number,
  balance_end: Number,
  pnl: Number,
  performance: Number,
  accountStatus: Number, // 0=disabled, 1=enabled
  accountType: Number,   // 0=master, 1=slave
  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
