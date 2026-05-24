const express = require('express');
const router = express.Router();
const {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getCompanies)
  .post(authorize('admin'), createCompany);

router.route('/:id')
  .get(getCompany)
  .put(authorize('admin'), updateCompany)
  .delete(authorize('admin'), deleteCompany);

module.exports = router;
