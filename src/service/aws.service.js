const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID,
    region: process.env.AWS_REGION
});

const uploadFile = (res, file) => {
    return new Promise((resolve, reject) => {
        // if (file.mimetype.indexOf('image') == -1) {
        //     res.status(400).send({
        //         status: false,
        //         message: 'Only image files are allowed !'
        //     });
        //     return false;
        // }
        const S3 = new AWS.S3({
            apiVersion: '2006-03-01'
        });

        const uploadParams = {
            ACL: "public-read",
            Bucket: "functionup-93",
            Key: "userPorfile/" + file.originalname,
            Body: file.buffer
        }

        S3.upload(uploadParams, (error, dataRes) => {
            if (error) {
                reject(error);
            }
            resolve(dataRes.Location)
        });
    });
}

module.exports = {
    uploadFile
}