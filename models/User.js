const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String, // Ensure this is hashed
  role: { type: String, default: 'user' }, // Possible values: 'user', 'admin'
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);