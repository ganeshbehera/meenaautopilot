const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  accountId: String,
  login: String,
  server: String,
  broker: String,
  balance: Number,
  currency: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', AccountSchema);