const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        refs: 'User',
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Types.ObjectId,
                refs: 'Product'
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],
    totalPrice: Number,
    totalItems: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema); 