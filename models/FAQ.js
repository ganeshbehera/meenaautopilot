const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  question: String,
  answer: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FAQ', FAQSchema);