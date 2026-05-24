const Ledger = require('../models/Ledger');

// @desc    Create ledger
// @route   POST /api/ledgers
// @access  Private
exports.createLedger = async (req, res) => {
  try {
    const ledger = await Ledger.create(req.body);

    res.status(201).json({
      success: true,
      data: ledger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all ledgers
// @route   GET /api/ledgers
// @access  Private
exports.getLedgers = async (req, res) => {
  try {
    const { company, group } = req.query;

    let query = {};
    if (company) query.company = company;
    if (group) query.group = group;

    const ledgers = await Ledger.find(query)
      .populate('group')
      .populate('company')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: ledgers.length,
      data: ledgers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single ledger
// @route   GET /api/ledgers/:id
// @access  Private
exports.getLedger = async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id)
      .populate('group')
      .populate('company');

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: 'Ledger not found'
      });
    }

    // Calculate current balance
    await ledger.calculateBalance();

    res.json({
      success: true,
      data: ledger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update ledger
// @route   PUT /api/ledgers/:id
// @access  Private
exports.updateLedger = async (req, res) => {
  try {
    const ledger = await Ledger.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('group');

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: 'Ledger not found'
      });
    }

    res.json({
      success: true,
      data: ledger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete ledger
// @route   DELETE /api/ledgers/:id
// @access  Private (Admin/Accountant)
exports.deleteLedger = async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id);

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: 'Ledger not found'
      });
    }

    // Check if ledger is used in any voucher
    const Voucher = require('../models/Voucher');
    const voucherCount = await Voucher.countDocuments({
      'entries.ledger': ledger._id
    });

    if (voucherCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete ledger with existing transactions'
      });
    }

    await ledger.deleteOne();

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

// @desc    Get ledger statement
// @route   GET /api/ledgers/:id/statement
// @access  Private
exports.getLedgerStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const ledger = await Ledger.findById(req.params.id).populate('group');

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: 'Ledger not found'
      });
    }

    const Voucher = require('../models/Voucher');
    
    let query = {
      company: ledger.company,
      'entries.ledger': ledger._id
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const vouchers = await Voucher.find(query)
      .sort({ date: 1, voucherNumber: 1 })
      .populate('entries.ledger');

    // Calculate running balance
    let balance = ledger.openingBalance.amount;
    let balanceType = ledger.openingBalance.type;

    const transactions = [];

    vouchers.forEach(voucher => {
      voucher.entries.forEach(entry => {
        if (entry.ledger._id.toString() === ledger._id.toString()) {
          let debit = 0, credit = 0;

          if (entry.type === 'Dr') {
            debit = entry.amount;
            if (balanceType === 'Dr') {
              balance += entry.amount;
            } else {
              balance -= entry.amount;
              if (balance < 0) {
                balance = Math.abs(balance);
                balanceType = 'Dr';
              }
            }
          } else {
            credit = entry.amount;
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

          transactions.push({
            date: voucher.date,
            voucherType: voucher.voucherType,
            voucherNumber: voucher.voucherNumber,
            narration: voucher.narration,
            debit,
            credit,
            balance: `${balance.toFixed(2)} ${balanceType}`
          });
        }
      });
    });

    res.json({
      success: true,
      data: {
        ledger: {
          name: ledger.name,
          group: ledger.group.name,
          openingBalance: `${ledger.openingBalance.amount} ${ledger.openingBalance.type}`
        },
        transactions,
        closingBalance: `${balance.toFixed(2)} ${balanceType}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
