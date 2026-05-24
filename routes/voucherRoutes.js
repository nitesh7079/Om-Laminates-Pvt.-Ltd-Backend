const express = require('express');
const router = express.Router();
const {
  createVoucher,
  getVouchers,
  getVoucher,
  updateVoucher,
  deleteVoucher
} = require('../controllers/voucherController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getVouchers)
  .post(createVoucher);

router.route('/:id')
  .get(getVoucher)
  .put(authorize('admin', 'accountant'), updateVoucher)
  .delete(authorize('admin', 'accountant'), deleteVoucher);

module.exports = router;
