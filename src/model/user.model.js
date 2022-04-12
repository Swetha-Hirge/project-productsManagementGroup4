const mongoose = require('mongoose');
const isEmail = require('isemail');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    lname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: {
            validator: (data) => {
                return isEmail.validate(data);
            },
            message: 'Enter the valid Email Id'
        }
    },
    profileImage: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        match: [/^[6789]\d{9}$/, 'The mobile number must be 10 digits and should be only Indian number']
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: [8, 'Minimum password length is 8'],
        maxlength: [15, 'Maximum password length should be 15']
    },
    address: {
        shipping: {
            street: {
                type: String,
                required: true,
                trim: true
            },
            city: {
                type: String,
                required: true,
                trim: true
            },
            pincode: {
                type: Number,
                required: true,
                trim: true
            }
        },
        billing: {
            street: {
                type: String,
                required: true,
                trim: true
            },
            city: {
                type: String,
                required: true,
                trim: true
            },
            pincode: {
                type: Number,
                required: true,
                trim: true
            }
        }
    }
}, {
    timestamps: true
});
uniqueValidator.defaults.message = "The {PATH} is already exist !";
userSchema.plugin(uniqueValidator);

userSchema.pre('save', function (next) {
    bcrypt.hash(this.password, 10).then((encryptedPassword) => {
        this.password = encryptedPassword;
        next();
    }).catch((error) => {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    });
});
module.exports = mongoose.model('User', userSchema);
