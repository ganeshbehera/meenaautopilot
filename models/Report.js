const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  reportType: { type: String, required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  startDate: Date,
  endDate: Date,
  reportData: Object
});

module.exports = mongoose.model('Report', ReportSchema);