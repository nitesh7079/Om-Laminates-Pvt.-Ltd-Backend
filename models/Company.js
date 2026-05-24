const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  gstin: {
    type: String,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GSTIN']
  },
  pan: {
    type: String,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN']
  },
  email: {
    type: String,
    lowercase: true
  },
  phone: String,
  currency: {
    type: String,
    default: 'INR'
  },
  financialYear: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  logo: String,
  isActive: {
    type: Boolean,
    default: true
  },
  booksBeginningFrom: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
