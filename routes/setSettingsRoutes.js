// routes/setSettingsRoutes.js
const express = require('express');
const axios = require('axios');
const SetSettings = require('../models/SetSettings');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Set Settings for Trade Copier API
router.post('/setSettings', authenticateToken, async (req, res) => {
  try {
    // Define the base URL for setting the copy settings on the Trade Copier API
    const apiUrl = 'https://www.trade-copier.com/webservice/v4/settings/setSettings.php';

    // Define the headers for authentication
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Auth-Username': process.env.AUTH_USERNAME,
      'Auth-Token': process.env.AUTH_TOKEN,
    };

    // Extract data from request body
    const {
      id_master, id_slave, id_group, risk_factor_value, risk_factor_type, order_side, max_order_size,
      min_order_size, copier_status, symbol_master, symbol, pending_order, stop_loss, stop_loss_fixed_value,
      stop_loss_fixed_format, stop_loss_min_value, stop_loss_min_format, stop_loss_max_value, stop_loss_max_format,
      take_profit, take_profit_fixed_value, take_profit_fixed_format, take_profit_min_value,
      take_profit_min_format, take_profit_max_value, take_profit_max_format, trailing_stop_value,
      trailing_stop_format, max_risk_value, max_risk_format, comment, max_slippage, max_delay,
      force_min_round_up, round_down, split_order, price_improvement, max_position_size_a,
      max_position_size_s, max_position_size_a_m, max_position_size_s_m, max_open_count_a,
      max_open_count_s, max_open_count_a_m, max_open_count_s_m, max_daily_order_count_a,
      max_daily_order_count_s, max_daily_order_count_a_m, max_daily_order_count_s_m,
      global_stop_loss, global_stop_loss_value, global_stop_loss_type, global_take_profit,
      global_take_profit_value, global_take_profit_type,
    } = req.body;

    // Prepare the request data
    const requestData = new URLSearchParams();
    if (id_master) requestData.append('id_master', id_master);
    if (id_slave) requestData.append('id_slave', id_slave);
    if (id_group) requestData.append('id_group', id_group);
    if (risk_factor_value) requestData.append('risk_factor_value', risk_factor_value);
    if (risk_factor_type) requestData.append('risk_factor_type', risk_factor_type);
    if (order_side) requestData.append('order_side', order_side);
    if (max_order_size) requestData.append('max_order_size', max_order_size);
    if (min_order_size) requestData.append('min_order_size', min_order_size);
    if (copier_status) requestData.append('copier_status', copier_status);
    if (symbol_master) requestData.append('symbol_master', symbol_master);
    if (symbol) requestData.append('symbol', symbol);
    if (pending_order) requestData.append('pending_order', pending_order);
    if (stop_loss) requestData.append('stop_loss', stop_loss);
    if (stop_loss_fixed_value) requestData.append('stop_loss_fixed_value', stop_loss_fixed_value);
    if (stop_loss_fixed_format) requestData.append('stop_loss_fixed_format', stop_loss_fixed_format);
    if (stop_loss_min_value) requestData.append('stop_loss_min_value', stop_loss_min_value);
    if (stop_loss_min_format) requestData.append('stop_loss_min_format', stop_loss_min_format);
    if (stop_loss_max_value) requestData.append('stop_loss_max_value', stop_loss_max_value);
    if (stop_loss_max_format) requestData.append('stop_loss_max_format', stop_loss_max_format);
    if (take_profit) requestData.append('take_profit', take_profit);
    if (take_profit_fixed_value) requestData.append('take_profit_fixed_value', take_profit_fixed_value);
    if (take_profit_fixed_format) requestData.append('take_profit_fixed_format', take_profit_fixed_format);
    if (take_profit_min_value) requestData.append('take_profit_min_value', take_profit_min_value);
    if (take_profit_min_format) requestData.append('take_profit_min_format', take_profit_min_format);
    if (take_profit_max_value) requestData.append('take_profit_max_value', take_profit_max_value);
    if (take_profit_max_format) requestData.append('take_profit_max_format', take_profit_max_format);
    if (trailing_stop_value) requestData.append('trailing_stop_value', trailing_stop_value);
    if (trailing_stop_format) requestData.append('trailing_stop_format', trailing_stop_format);
    if (max_risk_value) requestData.append('max_risk_value', max_risk_value);
    if (max_risk_format) requestData.append('max_risk_format', max_risk_format);
    if (comment) requestData.append('comment', comment);
    if (max_slippage) requestData.append('max_slippage', max_slippage);
    if (max_delay) requestData.append('max_delay', max_delay);
    if (force_min_round_up) requestData.append('force_min_round_up', force_min_round_up);
    if (round_down) requestData.append('round_down', round_down);
    if (split_order) requestData.append('split_order', split_order);
    if (price_improvement) requestData.append('price_improvement', price_improvement);
    if (max_position_size_a) requestData.append('max_position_size_a', max_position_size_a);
    if (max_position_size_s) requestData.append('max_position_size_s', max_position_size_s);
    if (max_position_size_a_m) requestData.append('max_position_size_a_m', max_position_size_a_m);
    if (max_position_size_s_m) requestData.append('max_position_size_s_m', max_position_size_s_m);
    if (max_open_count_a) requestData.append('max_open_count_a', max_open_count_a);
    if (max_open_count_s) requestData.append('max_open_count_s', max_open_count_s);
    if (max_open_count_a_m) requestData.append('max_open_count_a_m', max_open_count_a_m);
    if (max_open_count_s_m) requestData.append('max_open_count_s_m', max_open_count_s_m);
    if (max_daily_order_count_a) requestData.append('max_daily_order_count_a', max_daily_order_count_a);
    if (max_daily_order_count_s) requestData.append('max_daily_order_count_s', max_daily_order_count_s);
    if (max_daily_order_count_a_m) requestData.append('max_daily_order_count_a_m', max_daily_order_count_a_m);
    if (max_daily_order_count_s_m) requestData.append('max_daily_order_count_s_m', max_daily_order_count_s_m);
    if (global_stop_loss) requestData.append('global_stop_loss', global_stop_loss);
    if (global_stop_loss_value) requestData.append('global_stop_loss_value', global_stop_loss_value);
    if (global_stop_loss_type) requestData.append('global_stop_loss_type', global_stop_loss_type);
    if (global_take_profit) requestData.append('global_take_profit', global_take_profit);
    if (global_take_profit_value) requestData.append('global_take_profit_value', global_take_profit_value);
    if (global_take_profit_type) requestData.append('global_take_profit_type', global_take_profit_type);

    // Make the POST request to set the settings on the Trade Copier API
    const response = await axios.post(apiUrl, requestData.toString(), {
      headers: headers,
    });

    // Save or update settings in MongoDB
    await SetSettings.findOneAndUpdate(
      { id_master, id_slave, id_group },
      req.body,
      { upsert: true, new: true }
    );

    // Respond with API response
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error setting settings:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to set settings' });
  }
});

module.exports = router;
