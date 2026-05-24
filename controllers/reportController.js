const Voucher = require('../models/Voucher');
const Ledger = require('../models/Ledger');
const Group = require('../models/Group');
const InventoryItem = require('../models/InventoryItem');
const Company = require('../models/Company');

// @desc    Get Trial Balance
// @route   GET /api/reports/trial-balance
// @access  Private
exports.getTrialBalance = async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;

    const ledgers = await Ledger.find({ company }).populate('group');

    const trialBalance = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const ledger of ledgers) {
      await ledger.calculateBalance();

      if (ledger.currentBalance.amount > 0) {
        const entry = {
          ledger: ledger.name,
          group: ledger.group.name,
          debit: ledger.currentBalance.type === 'Dr' ? ledger.currentBalance.amount : 0,
          credit: ledger.currentBalance.type === 'Cr' ? ledger.currentBalance.amount : 0
        };

        totalDebit += entry.debit;
        totalCredit += entry.credit;
        trialBalance.push(entry);
      }
    }

    res.json({
      success: true,
      data: {
        entries: trialBalance,
        totals: {
          debit: totalDebit.toFixed(2),
          credit: totalCredit.toFixed(2),
          difference: Math.abs(totalDebit - totalCredit).toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Profit & Loss Account
// @route   GET /api/reports/profit-loss
// @access  Private
exports.getProfitLoss = async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;

    const groups = await Group.find({ company });
    const ledgers = await Ledger.find({ company }).populate('group');

    const income = { direct: [], indirect: [], total: 0 };
    const expenses = { direct: [], indirect: [], total: 0 };

    for (const ledger of ledgers) {
      await ledger.calculateBalance();

      if (ledger.group.nature === 'Income') {
        const amount = ledger.currentBalance.type === 'Cr' 
          ? ledger.currentBalance.amount 
          : -ledger.currentBalance.amount;

        const entry = {
          ledger: ledger.name,
          amount: Math.abs(amount)
        };

        if (ledger.group.affectsGrossProfit) {
          income.direct.push(entry);
        } else {
          income.indirect.push(entry);
        }
        income.total += Math.abs(amount);
      }

      if (ledger.group.nature === 'Expenses') {
        const amount = ledger.currentBalance.type === 'Dr' 
          ? ledger.currentBalance.amount 
          : -ledger.currentBalance.amount;

        const entry = {
          ledger: ledger.name,
          amount: Math.abs(amount)
        };

        if (ledger.group.affectsGrossProfit) {
          expenses.direct.push(entry);
        } else {
          expenses.indirect.push(entry);
        }
        expenses.total += Math.abs(amount);
      }
    }

    const grossProfit = income.direct.reduce((sum, i) => sum + i.amount, 0) - 
                       expenses.direct.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = income.total - expenses.total;

    res.json({
      success: true,
      data: {
        income,
        expenses,
        grossProfit: grossProfit.toFixed(2),
        netProfit: netProfit.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Balance Sheet
// @route   GET /api/reports/balance-sheet
// @access  Private
exports.getBalanceSheet = async (req, res) => {
  try {
    const { company, date } = req.query;

    const ledgers = await Ledger.find({ company }).populate('group');

    const assets = [];
    const liabilities = [];
    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const ledger of ledgers) {
      await ledger.calculateBalance();

      if (ledger.currentBalance.amount > 0) {
        if (ledger.group.nature === 'Assets') {
          const amount = ledger.currentBalance.type === 'Dr' 
            ? ledger.currentBalance.amount 
            : -ledger.currentBalance.amount;

          assets.push({
            ledger: ledger.name,
            group: ledger.group.name,
            amount: Math.abs(amount)
          });
          totalAssets += Math.abs(amount);
        }

        if (ledger.group.nature === 'Liabilities') {
          const amount = ledger.currentBalance.type === 'Cr' 
            ? ledger.currentBalance.amount 
            : -ledger.currentBalance.amount;

          liabilities.push({
            ledger: ledger.name,
            group: ledger.group.name,
            amount: Math.abs(amount)
          });
          totalLiabilities += Math.abs(amount);
        }
      }
    }

    res.json({
      success: true,
      data: {
        assets,
        liabilities,
        totalAssets: totalAssets.toFixed(2),
        totalLiabilities: totalLiabilities.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Cash Book
// @route   GET /api/reports/cash-book
// @access  Private
exports.getCashBook = async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;

    // Find Cash-in-Hand ledger
    const cashGroup = await Group.findOne({ company, name: 'Cash-in-Hand' });
    const cashLedger = await Ledger.findOne({ company, group: cashGroup._id });

    if (!cashLedger) {
      return res.status(404).json({
        success: false,
        message: 'Cash ledger not found'
      });
    }

    let query = {
      company,
      'entries.ledger': cashLedger._id
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

    let balance = cashLedger.openingBalance.amount;
    const transactions = [];

    vouchers.forEach(voucher => {
      voucher.entries.forEach(entry => {
        if (entry.ledger._id.toString() === cashLedger._id.toString()) {
          if (entry.type === 'Dr') {
            balance += entry.amount;
            transactions.push({
              date: voucher.date,
              particulars: voucher.narration,
              voucherType: voucher.voucherType,
              voucherNumber: voucher.voucherNumber,
              receipt: entry.amount,
              payment: 0,
              balance: balance.toFixed(2)
            });
          } else {
            balance -= entry.amount;
            transactions.push({
              date: voucher.date,
              particulars: voucher.narration,
              voucherType: voucher.voucherType,
              voucherNumber: voucher.voucherNumber,
              receipt: 0,
              payment: entry.amount,
              balance: balance.toFixed(2)
            });
          }
        }
      });
    });

    res.json({
      success: true,
      data: {
        openingBalance: cashLedger.openingBalance.amount,
        transactions,
        closingBalance: balance.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Bank Book
// @route   GET /api/reports/bank-book
// @access  Private
exports.getBankBook = async (req, res) => {
  try {
    const { company, ledgerId, startDate, endDate } = req.query;

    const bankLedger = await Ledger.findById(ledgerId).populate('group');

    if (!bankLedger || bankLedger.group.name !== 'Bank Accounts') {
      return res.status(404).json({
        success: false,
        message: 'Bank ledger not found'
      });
    }

    let query = {
      company,
      'entries.ledger': bankLedger._id
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

    let balance = bankLedger.openingBalance.amount;
    const transactions = [];

    vouchers.forEach(voucher => {
      voucher.entries.forEach(entry => {
        if (entry.ledger._id.toString() === bankLedger._id.toString()) {
          if (entry.type === 'Dr') {
            balance += entry.amount;
            transactions.push({
              date: voucher.date,
              particulars: voucher.narration,
              voucherType: voucher.voucherType,
              voucherNumber: voucher.voucherNumber,
              deposit: entry.amount,
              withdrawal: 0,
              balance: balance.toFixed(2)
            });
          } else {
            balance -= entry.amount;
            transactions.push({
              date: voucher.date,
              particulars: voucher.narration,
              voucherType: voucher.voucherType,
              voucherNumber: voucher.voucherNumber,
              deposit: 0,
              withdrawal: entry.amount,
              balance: balance.toFixed(2)
            });
          }
        }
      });
    });

    res.json({
      success: true,
      data: {
        bankName: bankLedger.name,
        accountNumber: bankLedger.bankDetails?.accountNumber,
        openingBalance: bankLedger.openingBalance.amount,
        transactions,
        closingBalance: balance.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Day Book
// @route   GET /api/reports/day-book
// @access  Private
exports.getDayBook = async (req, res) => {
  try {
    const { company, date } = req.query;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const vouchers = await Voucher.find({
      company,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ voucherNumber: 1 })
    .populate('entries.ledger');

    const dayBook = vouchers.map(voucher => {
      const debitEntries = voucher.entries.filter(e => e.type === 'Dr');
      const creditEntries = voucher.entries.filter(e => e.type === 'Cr');

      return {
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.voucherType,
        debitLedgers: debitEntries.map(e => ({ name: e.ledger.name, amount: e.amount })),
        creditLedgers: creditEntries.map(e => ({ name: e.ledger.name, amount: e.amount })),
        narration: voucher.narration,
        totalAmount: voucher.totalAmount
      };
    });

    res.json({
      success: true,
      date: startDate.toDateString(),
      count: dayBook.length,
      data: dayBook
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Outstanding Receivables
// @route   GET /api/reports/receivables
// @access  Private
exports.getReceivables = async (req, res) => {
  try {
    const { company } = req.query;

    const debtorsGroup = await Group.findOne({ company, name: 'Sundry Debtors' });
    const debtors = await Ledger.find({ company, group: debtorsGroup._id });

    const receivables = [];
    let totalOutstanding = 0;

    for (const debtor of debtors) {
      await debtor.calculateBalance();

      if (debtor.currentBalance.type === 'Dr' && debtor.currentBalance.amount > 0) {
        receivables.push({
          party: debtor.name,
          contact: debtor.contactDetails,
          outstanding: debtor.currentBalance.amount
        });
        totalOutstanding += debtor.currentBalance.amount;
      }
    }

    res.json({
      success: true,
      count: receivables.length,
      totalOutstanding: totalOutstanding.toFixed(2),
      data: receivables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Outstanding Payables
// @route   GET /api/reports/payables
// @access  Private
exports.getPayables = async (req, res) => {
  try {
    const { company } = req.query;

    const creditorsGroup = await Group.findOne({ company, name: 'Sundry Creditors' });
    const creditors = await Ledger.find({ company, group: creditorsGroup._id });

    const payables = [];
    let totalOutstanding = 0;

    for (const creditor of creditors) {
      await creditor.calculateBalance();

      if (creditor.currentBalance.type === 'Cr' && creditor.currentBalance.amount > 0) {
        payables.push({
          party: creditor.name,
          contact: creditor.contactDetails,
          outstanding: creditor.currentBalance.amount
        });
        totalOutstanding += creditor.currentBalance.amount;
      }
    }

    res.json({
      success: true,
      count: payables.length,
      totalOutstanding: totalOutstanding.toFixed(2),
      data: payables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Stock Summary
// @route   GET /api/reports/stock-summary
// @access  Private
exports.getStockSummary = async (req, res) => {
  try {
    const { company } = req.query;

    const items = await InventoryItem.find({ company, isActive: true });

    const summary = items.map(item => ({
      name: item.name,
      unit: item.unit,
      openingQty: item.openingStock.quantity,
      openingValue: item.openingStock.value,
      currentQty: item.currentStock.quantity,
      currentValue: item.currentStock.value,
      averageRate: item.currentStock.quantity > 0 
        ? (item.currentStock.value / item.currentStock.quantity).toFixed(2)
        : 0
    }));

    const totalValue = summary.reduce((sum, item) => sum + item.currentValue, 0);

    res.json({
      success: true,
      count: summary.length,
      totalValue: totalValue.toFixed(2),
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Dashboard Summary
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    const { company } = req.query;

    // Get company details
    const companyDetails = await Company.findById(company);

    // Calculate total sales
    const salesVouchers = await Voucher.find({
      company,
      voucherType: 'Sales'
    });
    const totalSales = salesVouchers.reduce((sum, v) => sum + v.totalAmount, 0);

    // Calculate total purchase
    const purchaseVouchers = await Voucher.find({
      company,
      voucherType: 'Purchase'
    });
    const totalPurchase = purchaseVouchers.reduce((sum, v) => sum + v.totalAmount, 0);

    // Get cash balance
    const cashGroup = await Group.findOne({ company, name: 'Cash-in-Hand' });
    const cashLedger = await Ledger.findOne({ company, group: cashGroup?._id });
    let cashBalance = 0;
    if (cashLedger) {
      await cashLedger.calculateBalance();
      cashBalance = cashLedger.currentBalance.amount;
    }

    // Get bank balance
    const bankGroup = await Group.findOne({ company, name: 'Bank Accounts' });
    const bankLedgers = await Ledger.find({ company, group: bankGroup?._id });
    let bankBalance = 0;
    for (const bank of bankLedgers) {
      await bank.calculateBalance();
      bankBalance += bank.currentBalance.amount;
    }

    // Calculate profit
    const incomeGroups = await Group.find({ company, nature: 'Income' });
    const expenseGroups = await Group.find({ company, nature: 'Expenses' });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const group of incomeGroups) {
      const ledgers = await Ledger.find({ company, group: group._id });
      for (const ledger of ledgers) {
        await ledger.calculateBalance();
        if (ledger.currentBalance.type === 'Cr') {
          totalIncome += ledger.currentBalance.amount;
        }
      }
    }

    for (const group of expenseGroups) {
      const ledgers = await Ledger.find({ company, group: group._id });
      for (const ledger of ledgers) {
        await ledger.calculateBalance();
        if (ledger.currentBalance.type === 'Dr') {
          totalExpenses += ledger.currentBalance.amount;
        }
      }
    }

    const profit = totalIncome - totalExpenses;

    // Get monthly sales chart data
    const currentYear = new Date().getFullYear();
    const monthlySales = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0);

      const monthSales = await Voucher.find({
        company,
        voucherType: 'Sales',
        date: { $gte: startDate, $lte: endDate }
      });

      monthlySales.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        sales: monthSales.reduce((sum, v) => sum + v.totalAmount, 0)
      });
    }

    res.json({
      success: true,
      data: {
        company: companyDetails.name,
        summary: {
          totalSales: totalSales.toFixed(2),
          totalPurchase: totalPurchase.toFixed(2),
          cashBalance: cashBalance.toFixed(2),
          bankBalance: bankBalance.toFixed(2),
          profit: profit.toFixed(2),
          profitPercentage: totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : 0
        },
        charts: {
          monthlySales
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
