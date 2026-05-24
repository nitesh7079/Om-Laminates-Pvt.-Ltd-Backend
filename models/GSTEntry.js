const mongoose = require('mongoose');

const gstEntrySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ledger',
    required: true
  },
  gstin: String,
  invoiceNumber: String,
  transactionType: {
    type: String,
    enum: ['Sales', 'Purchase', 'Sales Return', 'Purchase Return'],
    required: true
  },
  placeOfSupply: String,
  taxableAmount: {
    type: Number,
    required: true
  },
  cgst: {
    rate: Number,
    amount: Number
  },
  sgst: {
    rate: Number,
    amount: Number
  },
  igst: {
    rate: Number,
    amount: Number
  },
  cess: {
    rate: Number,
    amount: Number
  },
  totalTax: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  reverseCharge: {
    type: Boolean,
    default: false
  },
  items: [{
    description: String,
    hsnCode: String,
    quantity: Number,
    rate: Number,
    taxableValue: Number,
    gstRate: Number
  }]
}, {
  timestamps: true
});

// Index
gstEntrySchema.index({ company: 1, date: -1 });
gstEntrySchema.index({ company: 1, transactionType: 1 });

module.exports = mongoose.model('GSTEntry', gstEntrySchema);
