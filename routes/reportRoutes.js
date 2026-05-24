const express = require('express');
const router = express.Router();
const {
  getTrialBalance,
  getProfitLoss,
  getBalanceSheet,
  getCashBook,
  getBankBook,
  getDayBook,
  getReceivables,
  getPayables,
  getStockSummary,
  getDashboard
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/trial-balance', getTrialBalance);
router.get('/profit-loss', getProfitLoss);
router.get('/balance-sheet', getBalanceSheet);
router.get('/cash-book', getCashBook);
router.get('/bank-book', getBankBook);
router.get('/day-book', getDayBook);
router.get('/receivables', getReceivables);
router.get('/payables', getPayables);
router.get('/stock-summary', getStockSummary);
router.get('/dashboard', getDashboard);

module.exports = router;
