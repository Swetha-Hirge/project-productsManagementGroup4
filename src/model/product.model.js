const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    currencyId: {
        type: String,
        required: true
    },
    currencyFormat: {
        type: String,
        required: true
    },
    isFreeShipping: {
        type: Boolean,
        default: false
    },
    productImage: {
        type: String,
        required: true
    },
    style: String,
    availableSizes: {
        type: [String],
        enum: {
            values: ["S", "XS", "M", "X", "L", "XXL", "XL"],
            message: 'Only these sizes are allowed ["S", "XS", "M", "X", "L", "XXL", "XL"]'
        }
    },
    installments: Number,
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

uniqueValidator.defaults.message = "The {PATH} is already exist !";
productSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Product', productSchema);