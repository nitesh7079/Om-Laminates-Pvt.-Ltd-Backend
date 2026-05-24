const express = require('express');
const router = express.Router();
const {
  createLedger,
  getLedgers,
  getLedger,
  updateLedger,
  deleteLedger,
  getLedgerStatement
} = require('../controllers/ledgerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getLedgers)
  .post(createLedger);

router.route('/:id')
  .get(getLedger)
  .put(updateLedger)
  .delete(authorize('admin', 'accountant'), deleteLedger);

router.get('/:id/statement', getLedgerStatement);

module.exports = router;
