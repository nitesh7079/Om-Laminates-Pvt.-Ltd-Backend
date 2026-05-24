const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup
} = require('../controllers/groupController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getGroups)
  .post(createGroup);

router.route('/:id')
  .get(getGroup)
  .put(updateGroup)
  .delete(authorize('admin'), deleteGroup);

module.exports = router;
