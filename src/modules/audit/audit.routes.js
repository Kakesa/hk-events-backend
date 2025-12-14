const express = require('express');
const router = express.Router();

const { getAudits } = require('./audit.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

router.get(
  '/',
  protect,
  restrictTo('admin'),
  getAudits
);

module.exports = router;
