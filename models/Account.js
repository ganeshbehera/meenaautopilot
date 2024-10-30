const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  accountId: String, // Unique account identifier
  type: {
    type: String, 
    enum: ['0', '1'], // 0 for Master, 1 for Slave
    required: true
  },
  name: {
    type: String,
    required: true // Custom account name
  },
  broker: {
    type: String,
    required: true
  },
  login: {
    type: String,
    required: true // Broker account login
  },
  password: {
    type: String,
    required: true // Broker account password
  },
  server: {
    type: String,
    required: true // Server details
  },
  environment: {
    type: String,
    required: true // Account environment
  },
  status: {
    type: Number,
    enum: [0, 1], // 0 = disabled, 1 = enabled
    required: true
  },
  group: {
    type: String, 
    required: false // Optional template group ID
  },
  subscription: {
    type: String,
    required: true // Subscription key or 'auto'
  },
  pending: {
    type: Number,
    enum: [0, 1],
    required: false, // Optional: Copy pending orders
    default: 0
  },
  stop_loss: {
    type: Number,
    enum: [0, 1],
    required: false, // Optional: Copy stop loss
    default: 0
  },
  take_profit: {
    type: Number,
    enum: [0, 1],
    required: false, // Optional: Copy take profit
    default: 0
  },
  comment: {
    type: String,
    required: false // Optional: Custom comment for trade terminal
  },
  alert_email: {
    type: Number,
    enum: [0, 1],
    required: false, // Optional: Send warning email
    default: 0
  },
  alert_sms: {
    type: Number,
    enum: [0, 1],
    required: false, // Optional: Send warning SMS
    default: 0
  },
  access_token: {
    type: String,
    required: false // Optional: Access token for cTrader
  },
  refresh_token: {
    type: String,
    required: false // Optional: Refresh token for cTrader
  },
  expiry_token: {
    type: String,
    required: false // Optional: Expiry token for cTrader
  },
  account: {
    type: String,
    required: false // Optional: Account name for cTrader
  },
  balance: {
    type: Number,
    required: false, // Balance for the account
  },
  currency: {
    type: String,
    required: false, // Currency type (e.g., USD)
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // New fields
  globalstoploss: {
    type: Number,
    enum: [0, 1],
    required: false, // Global stop loss enabled or disabled
  },
  globaltakeprofit: {
    type: Number,
    enum: [0, 1],
    required: false, // Global take profit enabled or disabled
  },
  globalstoplossvalue: {
    type: Number,
    required: false, // Value for global stop loss
  },
  globaltakeprofitvalue: {
    type: Number,
    required: false, // Value for global take profit
  },
  lastUpdate: {
    type: String,
    required: false // Last update date-time string
  }
});

module.exports = mongoose.model('Account', AccountSchema);
