const mongoose = require('mongoose');

const BacktestSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  strategy: String,
  parameters: Object,
  result: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Backtest', BacktestSchema);