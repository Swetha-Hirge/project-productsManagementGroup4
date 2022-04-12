const jwtService = require('../service/jwt.service');
const errorService = require('../service/error.service');
const userSchema = require('../model/user.model');

const auth = async (req, res, next) => {
    const bearerToken = req.headers.authorization;
    const token = bearerToken.split(" ")[1];
    const decodedToken = await jwtService.verifyToken(res, token);
    if (decodedToken != undefined) {
        const userRes = await userSchema.findById(decodedToken.userId);
        if (!userRes) {
            return res.status(401).send({
                status: false,
                message: 'You are unauthenticated !'
            });
        }
        next();
    }
}

const authorization = async (req, res, next) => {
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
    next();
}

module.exports = {
    auth,
    authorization
}