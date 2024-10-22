const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);