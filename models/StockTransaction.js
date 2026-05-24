const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true
  },
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  transactionType: {
    type: String,
    enum: ['In', 'Out'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  quantity: {
    type: Number,
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceQuantity: {
    type: Number,
    required: true
  },
  balanceValue: {
    type: Number,
    required: true
  },
  reference: String,
  narration: String
}, {
  timestamps: true
});

// Index
stockTransactionSchema.index({ company: 1, inventoryItem: 1, date: -1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
