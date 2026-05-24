const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  stockGroup: {
    type: String,
    default: 'Primary'
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    default: 'Nos'
  },
  hsnCode: {
    type: String,
    trim: true
  },
  sacCode: {
    type: String,
    trim: true
  },
  gstRate: {
    type: Number,
    default: 0
  },
  openingStock: {
    quantity: {
      type: Number,
      default: 0
    },
    rate: {
      type: Number,
      default: 0
    },
    value: {
      type: Number,
      default: 0
    },
    date: {
      type: Date,
      required: true
    }
  },
  currentStock: {
    quantity: {
      type: Number,
      default: 0
    },
    value: {
      type: Number,
      default: 0
    }
  },
  reorderLevel: {
    type: Number,
    default: 0
  },
  valuationMethod: {
    type: String,
    enum: ['FIFO', 'LIFO', 'Average', 'Weighted Average'],
    default: 'Average'
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
inventoryItemSchema.index({ company: 1, name: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
