const userSchema = require('../model/user.model');
const errorService = require('../service/error.service');
const awsService = require('../service/aws.service');
const jwtService = require('../service/jwt.service');
const bcrypt = require('bcrypt');
const isEmail = require('isemail');

const register = async (req, res) => {
    try {
        const data = req.body;
        const file = req.files;

        const requiredFields = ['fname', 'lname', 'email', 'phone', 'password', 'address.shipping.street', 'address.shipping.city', 'address.shipping.pincode', 'address.billing.street', 'address.billing.city', 'address.billing.pincode'];

        for (let i = 0; i < requiredFields.length; i++) {
            if (!data[requiredFields[i]] || !data[requiredFields[i]].trim()) {
                return sendResponse(res, 400, false, `${requiredFields[i]} field is required`);
            }
            else if (data[requiredFields[i]].trim() == "null" || data[requiredFields[i]].trim() == "undefined") {
                return sendResponse(res, 400, false, `${requiredFields[i]} must be a valid data`);
            }
            else if (requiredFields[i].trim() == 'email') {
                if (!isEmail.validate(data.email)) {
                    return res.status(400).send({
                        status: false,
                        message: 'Enter a valid Email Id'
                    });
                }
            }
            else if (requiredFields[i].trim() == 'phone') {
                const regex = /^[6789]\d{9}$/;
                if (!regex.test(data.phone)) {
                    return res.status(400).send({
                        status: false,
                        message: 'The mobile number must be 10 digits and should be only Indian number'
                    });
                }
            }
            else if (requiredFields[i].trim() == 'address.shipping.pincode' || requiredFields[i].trim() == 'address.billing.pincode') {
                const regex = /^\d{6}$/;
                if (!regex.test(data[requiredFields[i]])) {
                    return res.status(400).send({
                        status: false,
                        message: `Enter the valid Pincode of ${requiredFields[i]}`
                    });
                }
            }
        }

        if (file && file.length > 0) {
            if (file[0].mimetype.indexOf('image') == -1) {
                return sendResponse(res, 400, false, 'Only image files are allowed !');
            }
            const profile_url = await awsService.uploadFile(file[0]);
            data.profileImage = profile_url;
        }
        else {
            return sendResponse(res, 400, false, `profileImage field is required`);
        }
        const dataRes = await userSchema.create(data);
        return res.status(201).send({
            status: true,
            message: "User created successfully",
            data: dataRes
        });
    } catch (error) {
        errorService.httpError(res, error);
    }
}

const login = async (req, res) => {
    try {
        const data = req.body;
        const { email, password } = data;

        if (Object.keys(data).length == 0) {
            return res.status(400).send({
                status: false,
                message: 'Email and Password field is required '
            });
        }

        if (!email.trim() || email.trim() == '') {
            return res.status(400).send({
                status: false,
                message: 'Email field is required '
            });
        }

        if (!password.trim() || password.trim() == '') {
            return res.status(400).send({
                status: false,
                message: 'Password field is required '
            });
        }

        if (!isEmail.validate(email)) {
            return res.status(400).send({
                status: false,
                message: 'Enter a valid Email Id'
            });
        }

        const userRes = await userSchema.findOne({
            email: email
        });
        if (!userRes) {
            return res.status(401).send({
                status: false,
                message: 'Invalid email Id'
            });
        }

        bcrypt.compare(password, userRes.password).then((result) => {
            if (!result) {
                return res.status(401).send({
                    status: false,
                    message: 'Invalid email and password'
                });
            }

            const token = jwtService.createToken(userRes._id);
            if (token != undefined) {
                return res.status(200).send({
                    status: true,
                    message: "User login success !",
                    data: {
                        userId: userRes._id,
                        token: token
                    }
                });
            }
        }).catch((error) => {
            return res.status(500).send({
                status: false,
                message: error.message
            });
        });;
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const userRes = await userSchema.findById(userId);
        if (!userRes) {
            return res.status(404).send({
                status: false,
                message: 'User not found'
            });
        }

        return res.status(200).send({
            status: true,
            message: 'User profile details',
            data: userRes
        });

    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = req.body;
        const keys = Object.keys(data);
        const file = req.files;

        for (let i = 0; i < keys.length; i++) {
            if (keys[i] == '_id') {
                return res.status(400).send({
                    status: false,
                    message: 'You are not able to update _id property'
                });
            }
            else {
                if (data[keys[i]].trim() == '') {
                    return res.status(400).send({
                        status: false,
                        message: `${keys[i]} should not be empty !`
                    });
                }
                else if (keys[i] == 'email') {
                    if (!isEmail.validate(data.email)) {
                        return res.status(400).send({
                            status: false,
                            message: 'Enter a valid Email Id'
                        });
                    }
                }
                else if (keys[i] == 'phone') {
                    const regex = /^[6789]\d{9}$/;
                    if (!regex.test(data.phone)) {
                        return res.status(400).send({
                            status: false,
                            message: 'The mobile number must be 10 digits and should be only Indian number'
                        });
                    }
                }
                else if (keys[i] == 'address.shipping.pincode' || keys[i] == 'address.billing.pincode') {
                    const regex = /^\d{6}$/;
                    if (!regex.test(data[keys[i]])) {
                        return res.status(400).send({
                            status: false,
                            message: `Enter the valid Pincode of ${keys[i]}`
                        });
                    }
                }
                else if (keys[i] == 'password') {
                    if (!(data.password.length > 8 && data.password.length <= 15)) {
                        return res.status(400).send({
                            status: false,
                            message: 'Minimum password should be 8 and maximum will be 15'
                        });
                    }
                    data.password = bcrypt.hashSync(data.password, 10);
                }
            }
        }
        if (file && file.length > 0) {
            if (file[0].mimetype.indexOf('image') == -1) {
                return sendResponse(res, 400, false, 'Only image files are allowed !');
            }
            const profile_url = await awsService.uploadFile(file[0]);
            data.profileImage = profile_url;
        }
        const updateRes = await userSchema.findByIdAndUpdate(userId, data, {
            new: true
        });
        return res.status(200).send({
            status: true,
            message: `${Object.keys(data).length} field has been updated successfully !`,
            data: updateRes
        });
    } catch (error) {
        if (error.code == 11000) {
            const key = Object.keys(error['keyValue']);
            return res.status(400).send({
                status: false,
                message: `[${error['keyValue'][key]}] ${key} is already exist ! `
            });
        }
        if (error.name == 'CastError') {
            return res.status(400).send({
                status: false,
                message: error.message
            });
        }
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

const sendResponse = (res, status_code, status_s, message) => {
    res.status(status_code).send({
        status: status_s,
        message: message
    });
}
module.exports = {
    register,
    login,
    getUserProfile,
    updateUserProfile
}