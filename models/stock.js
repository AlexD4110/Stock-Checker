const mongoose = require('mongoose');
const { Schema } = mongoose;

const StockSchema = new Schema({
  symbol: { type: String, required: true },
  likes: { type: [String], default: [] } // Using IP address to prevent multiple likes
});

const Stock = mongoose.model('Stock', StockSchema);

module.exports = Stock;  // Simplified export
