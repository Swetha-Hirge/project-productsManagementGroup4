const express = require('express');
const router = express.Router();

const userController = require('../controller/user.controller');
const productController = require('../controller/product.controller');
const cartController = require('../controller/cart.controller');

const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/user/:userId/profile', authMiddleware.auth, authMiddleware.authorization, userController.getUserProfile);
router.put('/user/:userId/profile', authMiddleware.auth, authMiddleware.authorization, userController.updateUserProfile);

router.post('/products', productController.createProduct);
router.get('/products', productController.getProudcts);
router.get('/products/:productId', productController.getProductById);
router.put('/products/:productId', productController.updateProductById);
router.delete('/products/:productId', productController.deleteProductById);

router.post('/users/:userId/cart', authMiddleware.auth, authMiddleware.authorization, cartController.createCart);
router.put('/users/:userId/cart', authMiddleware.auth, authMiddleware.authorization, cartController.updateCart);
router.get('/users/:userId/cart', authMiddleware.auth, authMiddleware.authorization, cartController.getCart);
router.delete('/users/:userId/cart', authMiddleware.auth, authMiddleware.authorization, cartController.deleteCart);

module.exports = router; 