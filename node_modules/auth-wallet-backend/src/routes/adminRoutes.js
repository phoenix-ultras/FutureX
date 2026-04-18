const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware, isAdmin);
router.get('/dashboard', adminController.getDashboard);
router.post('/market/close/:id', adminController.closeMarket);
router.post('/market/settle/:id', adminController.settleMarket);
router.post('/market/payout/:id', adminController.triggerPayout);
router.post('/market/close-time/:id', adminController.updateCloseTime);

module.exports = router;
