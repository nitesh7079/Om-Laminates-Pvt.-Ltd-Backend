const Voucher = require('../models/Voucher');
const Ledger = require('../models/Ledger');
const GSTEntry = require('../models/GSTEntry');
const StockTransaction = require('../models/StockTransaction');

// @desc    Create voucher
// @route   POST /api/vouchers
// @access  Private
exports.createVoucher = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    const voucher = await Voucher.create(req.body);

    // Update ledger balances
    await updateLedgerBalances(voucher);

    // Create GST entry if applicable
    if (voucher.gstDetails && voucher.gstDetails.totalTax > 0) {
      await createGSTEntry(voucher);
    }

    // Create stock transactions if items present
    if (voucher.items && voucher.items.length > 0) {
      await createStockTransactions(voucher);
    }

    const populatedVoucher = await Voucher.findById(voucher._id)
      .populate('entries.ledger')
      .populate('party')
      .populate('items.inventoryItem');

    res.status(201).json({
      success: true,
      data: populatedVoucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private
exports.getVouchers = async (req, res) => {
  try {
    const { company, voucherType, startDate, endDate, page = 1, limit = 50 } = req.query;

    let query = {};
    if (company) query.company = company;
    if (voucherType) query.voucherType = voucherType;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const vouchers = await Voucher.find(query)
      .populate('entries.ledger')
      .populate('party')
      .sort({ date: -1, voucherNumber: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Voucher.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: vouchers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single voucher
// @route   GET /api/vouchers/:id
// @access  Private
exports.getVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('entries.ledger')
      .populate('party')
      .populate('items.inventoryItem')
      .populate('createdBy', 'username email');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update voucher
// @route   PUT /api/vouchers/:id
// @access  Private
exports.updateVoucher = async (req, res) => {
  try {
    const oldVoucher = await Voucher.findById(req.params.id);

    if (!oldVoucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Reverse old transactions
    await reverseLedgerBalances(oldVoucher);

    // Update voucher
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('entries.ledger').populate('party');

    // Apply new transactions
    await updateLedgerBalances(voucher);

    // Add to edit history
    voucher.editHistory.push({
      editedBy: req.user.id,
      editedAt: Date.now(),
      changes: 'Voucher updated'
    });
    await voucher.save();

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete voucher
// @route   DELETE /api/vouchers/:id
// @access  Private (Admin/Accountant)
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Reverse ledger balances
    await reverseLedgerBalances(voucher);

    await voucher.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper functions
async function updateLedgerBalances(voucher) {
  for (const entry of voucher.entries) {
    const ledger = await Ledger.findById(entry.ledger);
    if (ledger) {
      await ledger.calculateBalance();
      await ledger.save();
    }
  }
}

async function reverseLedgerBalances(voucher) {
  // This would reverse the effect of voucher on ledgers
  // Implementation depends on how you want to handle reversal
  for (const entry of voucher.entries) {
    const ledger = await Ledger.findById(entry.ledger);
    if (ledger) {
      await ledger.calculateBalance();
      await ledger.save();
    }
  }
}

async function createGSTEntry(voucher) {
  const gstEntry = {
    company: voucher.company,
    voucher: voucher._id,
    date: voucher.date,
    party: voucher.party,
    invoiceNumber: voucher.invoiceNumber,
    transactionType: voucher.voucherType === 'Sales' ? 'Sales' : 'Purchase',
    taxableAmount: voucher.gstDetails.taxableAmount,
    cgst: voucher.gstDetails.cgst,
    sgst: voucher.gstDetails.sgst,
    igst: voucher.gstDetails.igst,
    totalTax: voucher.gstDetails.totalTax,
    totalAmount: voucher.totalAmount,
    items: voucher.items.map(item => ({
      description: item.inventoryItem?.name,
      quantity: item.quantity,
      rate: item.rate,
      taxableValue: item.amount
    }))
  };

  await GSTEntry.create(gstEntry);
}

async function createStockTransactions(voucher) {
  const InventoryItem = require('../models/InventoryItem');

  for (const item of voucher.items) {
    const transactionType = ['Sales', 'Debit Note'].includes(voucher.voucherType) ? 'Out' : 'In';
    
    const inventoryItem = await InventoryItem.findById(item.inventoryItem);
    
    if (inventoryItem) {
      const newQuantity = transactionType === 'In' 
        ? inventoryItem.currentStock.quantity + item.quantity
        : inventoryItem.currentStock.quantity - item.quantity;

      const newValue = transactionType === 'In'
        ? inventoryItem.currentStock.value + item.amount
        : inventoryItem.currentStock.value - item.amount;

      await StockTransaction.create({
        company: voucher.company,
        inventoryItem: item.inventoryItem,
        voucher: voucher._id,
        transactionType,
        date: voucher.date,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        balanceQuantity: newQuantity,
        balanceValue: newValue,
        reference: voucher.voucherNumber,
        narration: voucher.narration
      });

      inventoryItem.currentStock.quantity = newQuantity;
      inventoryItem.currentStock.value = newValue;
      await inventoryItem.save();
    }
  }
}
