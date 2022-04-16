const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
    totalItems: Number,
    totalQuantity: Number,
    cancellable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: {
            values: ['pending', 'completed', 'cancled'],
            message: "Only these status are allowed ['pending', 'completed', 'cancled']"
        }
    },
    deletedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);