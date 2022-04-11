const express = require('express');
const router = express.Router();

const userController = require('../controller/user.controller');

const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/user/:userId/profile', authMiddleware.auth, userController.getUserProfile);
router.put('/user/:userId/profile', authMiddleware.auth, userController.updateUserProfile);




module.exports = router; 