const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  nature: {
    type: String,
    enum: ['Assets', 'Liabilities', 'Income', 'Expenses'],
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  affectsGrossProfit: {
    type: Boolean,
    default: false
  },
  description: String
}, {
  timestamps: true
});

// Default groups as per Tally ERP 9
groupSchema.statics.getDefaultGroups = function() {
  return [
    // Assets
    { name: 'Bank Accounts', nature: 'Assets', isPrimary: true },
    { name: 'Branch / Divisions', nature: 'Assets', isPrimary: true },
    { name: 'Cash-in-Hand', nature: 'Assets', isPrimary: true },
    { name: 'Current Assets', nature: 'Assets', isPrimary: true },
    { name: 'Deposits (Asset)', nature: 'Assets', isPrimary: true },
    { name: 'Fixed Assets', nature: 'Assets', isPrimary: true },
    { name: 'Investments', nature: 'Assets', isPrimary: true },
    { name: 'Loans & Advances (Asset)', nature: 'Assets', isPrimary: true },
    { name: 'Misc. Expenses (ASSET)', nature: 'Assets', isPrimary: true },
    { name: 'Stock-in-hand', nature: 'Assets', isPrimary: true },
    { name: 'Sundry Debtors', nature: 'Assets', isPrimary: true },
    { name: 'Suspense A/c', nature: 'Assets', isPrimary: true },
    
    // Liabilities
    { name: 'Bank OCC A/c', nature: 'Liabilities', isPrimary: true },
    { name: 'Bank OD A/c', nature: 'Liabilities', isPrimary: true },
    { name: 'Capital Account', nature: 'Liabilities', isPrimary: true },
    { name: 'Current Liabilities', nature: 'Liabilities', isPrimary: true },
    { name: 'Duties & Taxes', nature: 'Liabilities', isPrimary: true },
    { name: 'Loans (Liability)', nature: 'Liabilities', isPrimary: true },
    { name: 'Provisions', nature: 'Liabilities', isPrimary: true },
    { name: 'Reserves & Surplus', nature: 'Liabilities', isPrimary: true },
    { name: 'Retained Earnings', nature: 'Liabilities', isPrimary: true },
    { name: 'Secured Loans', nature: 'Liabilities', isPrimary: true },
    { name: 'Sundry Creditors', nature: 'Liabilities', isPrimary: true },
    { name: 'Unsecured Loans', nature: 'Liabilities', isPrimary: true },
    
    // Income
    { name: 'Direct Incomes', nature: 'Income', isPrimary: true, affectsGrossProfit: true },
    { name: 'Income (Direct)', nature: 'Income', isPrimary: true, affectsGrossProfit: true },
    { name: 'Income (Indirect)', nature: 'Income', isPrimary: true },
    { name: 'Indirect Incomes', nature: 'Income', isPrimary: true },
    { name: 'Sales Accounts', nature: 'Income', isPrimary: true, affectsGrossProfit: true },
    
    // Expenses
    { name: 'Direct Expenses', nature: 'Expenses', isPrimary: true, affectsGrossProfit: true },
    { name: 'Expenses (Direct)', nature: 'Expenses', isPrimary: true, affectsGrossProfit: true },
    { name: 'Expenses (Indirect)', nature: 'Expenses', isPrimary: true },
    { name: 'Indirect Expenses', nature: 'Expenses', isPrimary: true },
    { name: 'Purchase Accounts', nature: 'Expenses', isPrimary: true, affectsGrossProfit: true }
  ];
};

module.exports = mongoose.model('Group', groupSchema);
