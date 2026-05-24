const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private
exports.createItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
exports.getItems = async (req, res) => {
  try {
    const { company, stockGroup } = req.query;

    let query = {};
    if (company) query.company = company;
    if (stockGroup) query.stockGroup = stockGroup;

    const items = await InventoryItem.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
exports.getItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
exports.updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
exports.deleteItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item has transactions
    const transactionCount = await StockTransaction.countDocuments({
      inventoryItem: item._id
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with existing transactions'
      });
    }

    await item.deleteOne();

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

// @desc    Get stock transactions for an item
// @route   GET /api/inventory/:id/transactions
// @access  Private
exports.getItemTransactions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {
      inventoryItem: req.params.id
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await StockTransaction.find(query)
      .populate('voucher')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get stock summary
// @route   GET /api/inventory/summary
// @access  Private
exports.getStockSummary = async (req, res) => {
  try {
    const { company } = req.query;

    const items = await InventoryItem.find({ company });

    const summary = items.map(item => ({
      name: item.name,
      unit: item.unit,
      quantity: item.currentStock.quantity,
      value: item.currentStock.value,
      averageRate: item.currentStock.quantity > 0 
        ? (item.currentStock.value / item.currentStock.quantity).toFixed(2)
        : 0,
      reorderLevel: item.reorderLevel,
      belowReorder: item.currentStock.quantity < item.reorderLevel
    }));

    res.json({
      success: true,
      count: summary.length,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
