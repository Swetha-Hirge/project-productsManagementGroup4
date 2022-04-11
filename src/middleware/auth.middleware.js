const jwtService = require('../service/jwt.service');
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

module.exports = {
    auth
}