const GSTEntry = require('../models/GSTEntry');

// @desc    Get GST entries
// @route   GET /api/gst
// @access  Private
exports.getGSTEntries = async (req, res) => {
  try {
    const { company, transactionType, startDate, endDate } = req.query;

    let query = {};
    if (company) query.company = company;
    if (transactionType) query.transactionType = transactionType;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const entries = await GSTEntry.find(query)
      .populate('party', 'name contactDetails.gstin')
      .populate('voucher', 'voucherNumber voucherType')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get GST summary
// @route   GET /api/gst/summary
// @access  Private
exports.getGSTSummary = async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;

    let query = { company };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const entries = await GSTEntry.find(query);

    const summary = {
      sales: {
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        totalAmount: 0
      },
      purchase: {
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        totalAmount: 0
      }
    };

    entries.forEach(entry => {
      const type = entry.transactionType.toLowerCase().includes('sales') ? 'sales' : 'purchase';
      
      summary[type].taxableAmount += entry.taxableAmount;
      summary[type].cgst += entry.cgst?.amount || 0;
      summary[type].sgst += entry.sgst?.amount || 0;
      summary[type].igst += entry.igst?.amount || 0;
      summary[type].totalTax += entry.totalTax;
      summary[type].totalAmount += entry.totalAmount;
    });

    summary.netTax = summary.sales.totalTax - summary.purchase.totalTax;

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get GSTR-1 report (Sales)
// @route   GET /api/gst/gstr1
// @access  Private
exports.getGSTR1 = async (req, res) => {
  try {
    const { company, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const entries = await GSTEntry.find({
      company,
      transactionType: { $in: ['Sales', 'Sales Return'] },
      date: { $gte: startDate, $lte: endDate }
    }).populate('party', 'name contactDetails.gstin contactDetails.state');

    // B2B Invoices
    const b2b = entries.filter(e => e.party?.contactDetails?.gstin);
    
    // B2C Invoices
    const b2c = entries.filter(e => !e.party?.contactDetails?.gstin);

    res.json({
      success: true,
      data: {
        month,
        year,
        b2b,
        b2c,
        summary: {
          totalInvoices: entries.length,
          totalTaxableValue: entries.reduce((sum, e) => sum + e.taxableAmount, 0),
          totalTax: entries.reduce((sum, e) => sum + e.totalTax, 0)
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

// @desc    Get GSTR-2 report (Purchase)
// @route   GET /api/gst/gstr2
// @access  Private
exports.getGSTR2 = async (req, res) => {
  try {
    const { company, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const entries = await GSTEntry.find({
      company,
      transactionType: { $in: ['Purchase', 'Purchase Return'] },
      date: { $gte: startDate, $lte: endDate }
    }).populate('party', 'name contactDetails.gstin');

    res.json({
      success: true,
      data: {
        month,
        year,
        entries,
        summary: {
          totalInvoices: entries.length,
          totalTaxableValue: entries.reduce((sum, e) => sum + e.taxableAmount, 0),
          totalTax: entries.reduce((sum, e) => sum + e.totalTax, 0)
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
