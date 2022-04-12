const mongoose = require('mongoose');

const httpError = (res, error) => {
    if (error['errors'] != null) {
        const key = Object.keys(error['errors']);
        key.reverse();
        return res.status(400).send({
            status: false,
            message: error['errors'][key[0]].message
        });
    }
    return res.status(500).send({
        status: false,
        message: error.message
    });
}

const handleObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}

module.exports = {
    httpError,
    handleObjectId
}