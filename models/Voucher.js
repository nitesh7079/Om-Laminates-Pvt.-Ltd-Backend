const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  voucherNumber: {
    type: String,
    required: true
  },
  voucherType: {
    type: String,
    enum: ['Payment', 'Receipt', 'Contra', 'Journal', 'Sales', 'Purchase', 'Credit Note', 'Debit Note'],
    required: [true, 'Voucher type is required']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  entries: [{
    ledger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      required: true
    },
    type: {
      type: String,
      enum: ['Dr', 'Cr'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  narration: {
    type: String,
    trim: true
  },
  // For Sales & Purchase vouchers
  invoiceNumber: String,
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ledger'
  },
  // GST Details
  gstDetails: {
    taxableAmount: Number,
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
    totalTax: Number
  },
  // Inventory items (for sales/purchase)
  items: [{
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem'
    },
    quantity: Number,
    rate: Number,
    amount: Number,
    discount: {
      type: Number,
      default: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPosted: {
    type: Boolean,
    default: true
  },
  // Audit trail
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: Date,
    changes: String
  }]
}, {
  timestamps: true
});

// Validate that Dr = Cr
voucherSchema.pre('save', function(next) {
  let debitTotal = 0;
  let creditTotal = 0;

  this.entries.forEach(entry => {
    if (entry.type === 'Dr') {
      debitTotal += entry.amount;
    } else {
      creditTotal += entry.amount;
    }
  });

  // Allow small floating point differences
  if (Math.abs(debitTotal - creditTotal) > 0.01) {
    next(new Error('Debit and Credit amounts must be equal'));
  } else {
    next();
  }
});

// Auto-generate voucher number
voucherSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }

  const prefix = this.voucherType.substring(0, 3).toUpperCase();
  const date = new Date(this.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Count vouchers of same type in the same company and month
  const count = await this.constructor.countDocuments({
    company: this.company,
    voucherType: this.voucherType,
    date: {
      $gte: new Date(year, date.getMonth(), 1),
      $lt: new Date(year, date.getMonth() + 1, 1)
    }
  });

  this.voucherNumber = `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  next();
});

// Index for faster queries
voucherSchema.index({ company: 1, voucherType: 1, date: -1 });

module.exports = mongoose.model('Voucher', voucherSchema);
