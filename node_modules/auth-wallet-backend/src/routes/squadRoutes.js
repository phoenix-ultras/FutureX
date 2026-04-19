const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const squadController = require('../controllers/squadController');

const router = express.Router();

router.get('/', squadController.listSquads);
router.get('/my', authMiddleware, squadController.mySquads);
router.get('/:id', squadController.getSquad);

router.post('/', authMiddleware, squadController.createSquad);
router.post('/:id/join', authMiddleware, squadController.joinSquad);
router.post('/:id/leave', authMiddleware, squadController.leaveSquad);

module.exports = router;
