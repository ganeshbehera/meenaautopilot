// models/SetSettings.js
const mongoose = require('mongoose');

const SetSettingsSchema = new mongoose.Schema({
  id_master: String,
  id_slave: String,
  id_group: String,
  risk_factor_value: Number,
  risk_factor_type: Number,
  order_side: Number,
  max_order_size: Number,
  min_order_size: Number,
  copier_status: Number,
  symbol_master: String,
  symbol: String,
  pending_order: Number,
  stop_loss: Number,
  stop_loss_fixed_value: Number,
  stop_loss_fixed_format: Number,
  stop_loss_min_value: Number,
  stop_loss_min_format: Number,
  stop_loss_max_value: Number,
  stop_loss_max_format: Number,
  take_profit: Number,
  take_profit_fixed_value: Number,
  take_profit_fixed_format: Number,
  take_profit_min_value: Number,
  take_profit_min_format: Number,
  take_profit_max_value: Number,
  take_profit_max_format: Number,
  trailing_stop_value: Number,
  trailing_stop_format: Number,
  max_risk_value: Number,
  max_risk_format: Number,
  comment: String,
  max_slippage: Number,
  max_delay: Number,
  force_min_round_up: Number,
  round_down: Number,
  split_order: Number,
  price_improvement: Number,
  max_position_size_a: Number,
  max_position_size_s: Number,
  max_position_size_a_m: Number,
  max_position_size_s_m: Number,
  max_open_count_a: Number,
  max_open_count_s: Number,
  max_open_count_a_m: Number,
  max_open_count_s_m: Number,
  max_daily_order_count_a: Number,
  max_daily_order_count_s: Number,
  max_daily_order_count_a_m: Number,
  max_daily_order_count_s_m: Number,
  global_stop_loss: Number,
  global_stop_loss_value: Number,
  global_stop_loss_type: Number,
  global_take_profit: Number,
  global_take_profit_value: Number,
  global_take_profit_type: Number,
});

module.exports = mongoose.model('SetSettings', SetSettingsSchema);
