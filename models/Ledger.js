const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ledger name is required'],
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required']
  },
  openingBalance: {
    amount: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['Dr', 'Cr'],
      default: 'Dr'
    },
    date: {
      type: Date,
      required: true
    }
  },
  currentBalance: {
    amount: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['Dr', 'Cr'],
      default: 'Dr'
    }
  },
  // For Sundry Debtors & Creditors
  contactDetails: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    email: String,
    gstin: String,
    pan: String
  },
  // For Bank accounts
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branch: String
  },
  // GST Details
  gstApplicable: {
    type: Boolean,
    default: false
  },
  gstType: {
    type: String,
    enum: ['Regular', 'Composition', 'Unregistered', 'None'],
    default: 'None'
  },
  // Tax settings
  taxRates: [{
    taxType: String, // CGST, SGST, IGST
    rate: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

// Index for faster queries
ledgerSchema.index({ company: 1, name: 1 });

// Calculate current balance method
ledgerSchema.methods.calculateBalance = async function() {
  const Voucher = mongoose.model('Voucher');
  
  const transactions = await Voucher.find({
    company: this.company,
    'entries.ledger': this._id
  });

  let balance = this.openingBalance.amount;
  let balanceType = this.openingBalance.type;

  transactions.forEach(voucher => {
    voucher.entries.forEach(entry => {
      if (entry.ledger.toString() === this._id.toString()) {
        if (entry.type === 'Dr') {
          if (balanceType === 'Dr') {
            balance += entry.amount;
          } else {
            balance -= entry.amount;
            if (balance < 0) {
              balance = Math.abs(balance);
              balanceType = 'Dr';
            }
          }
        } else { // Cr
          if (balanceType === 'Cr') {
            balance += entry.amount;
          } else {
            balance -= entry.amount;
            if (balance < 0) {
              balance = Math.abs(balance);
              balanceType = 'Cr';
            }
          }
        }
      }
    });
  });

  this.currentBalance = {
    amount: balance,
    type: balanceType
  };

  return this.currentBalance;
};

module.exports = mongoose.model('Ledger', ledgerSchema);
