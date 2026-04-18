const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Currently we use authMiddleware. In a real app we would use a requireAdmin middleware.
router.post('/market/close/:id', authMiddleware, adminController.closeMarket);
router.post('/market/settle/:id', authMiddleware, adminController.settleMarket);

module.exports = router;
