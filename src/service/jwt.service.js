const jwt = require('jsonwebtoken');
require('dotenv').config();

const create = (userId) => {
    return jwt.sign({
        userId: userId
    }, process.env.JWT_SECRET, { expiresIn: '5h' });
}

const verify = (res, token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (error, decodedToken) => {
            if (error) {
                return res.status(401).send({
                    status: false,
                    message: error.message
                });
            }
            resolve(decodedToken);
        });
    });
}

module.exports = {
    createToken: create,
    verifyToken: verify
}