const userSchema = require('../model/user.model');
const errorService = require('../service/error.service');
const awsService = require('../service/aws.service');
const jwtService = require('../service/jwt.service');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
    try {
        const data = req.body;
        const file = req.files;

        if (file && file.length > 0) {
            const profile_url = await awsService.uploadFile(file[0]);
            data.profileImage = profile_url;
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

        const userRes = await userSchema.findOne({
            email: email
        });
        if (!userRes) {
            return res.status(401).send({
                status: false,
                message: 'Invalid email and password [email]'
            });
        }

        const token = await jwtService.createToken(userRes._id);
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
        bcrypt.compare(password, userRes.password).then((result) => {
            if (!result) {
                return res.status(401).send({
                    status: false,
                    message: 'Invalid email and password [password]'
                });
            }
        }).catch((error) => {
            return res.status(500).send({
                status: false,
                message: error.message
            });
        });
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
        if (!errorService.handleObjectId(userId)) {
            return res.status(400).send({
                status: false,
                message: 'Only mongodb object id is allowed !'
            });
        }
        const bearerToken = req.headers.authorization;
        const token = bearerToken.split(" ")[1];
        const decodedToken = await jwtService.verifyToken(res, token);

        if (userId != decodedToken.userId) {
            return res.status(403).send({
                status: false,
                message: 'You are not authorized !'
            });
        }

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
        if (!errorService.handleObjectId(userId)) {
            return res.status(400).send({
                status: false,
                message: 'Only mongodb object id is allowed !'
            });
        }
        const bearerToken = req.headers.authorization;
        const token = bearerToken.split(" ")[1];
        const decodedToken = await jwtService.verifyToken(res, token);

        if (userId != decodedToken.userId) {
            return res.status(403).send({
                status: false,
                message: 'You are not authorized !'
            });
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
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

module.exports = {
    register,
    login,
    getUserProfile,
    updateUserProfile
}