const express = require('express');
const router = express.Router();
const {
  getGSTEntries,
  getGSTSummary,
  getGSTR1,
  getGSTR2
} = require('../controllers/gstController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getGSTEntries);
router.get('/summary', getGSTSummary);
router.get('/gstr1', getGSTR1);
router.get('/gstr2', getGSTR2);

module.exports = router;
