const productSchema = require('../model/product.model');
const awsService = require('../service/aws.service');
const mongoose = require('mongoose');

const handleObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}
const createProduct = async (req, res) => {
    try {
        const data = req.body;
        const file = req.files;

        const requiredFields = ['title', 'description', 'price', 'currencyId', 'currencyFormat'];

        for (let i = 0; i < requiredFields.length; i++) {
            if (!data[requiredFields[i]] || !data[requiredFields[i]].trim()) {
                return res.status(400).send({
                    status: false,
                    message: `${requiredFields[i]} field is required`
                });
            }
            else if (data[requiredFields[i]].trim() == "null" || data[requiredFields[i]].trim() == "undefined") {
                return res.status(400).send({
                    status: false,
                    message: `${requiredFields[i]} must be a valid data`
                });
            }
        }
        if (file && file.length > 0) {
            if (file[0].mimetype.indexOf('image') == -1) {
                return res.status(400).send({
                    status: false,
                    message: 'Only image files are allowed !'
                });
            }
            const profile_url = await awsService.uploadFile(file[0]);
            data.productImage = profile_url;
        }
        else {
            return res.status(400).send({
                status: false,
                message: `Product Image field is required`
            });
        }
        const insertRes = await productSchema.create(data);
        return res.status(201).send({
            status: true,
            message: "Product instered success",
            data: insertRes
        });
    } catch (error) {
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
}

const getProudcts = async (req, res) => {
    try {
        const data = req.query;
        const keys = Object.keys(data);
        if (keys.length > 0) {
            const requiredParams = ['size', 'name', 'priceGreaterThan', 'priceLessThan'];
            let status = false;
            for (let i = 0; i < keys.length; i++) {
                if (!requiredParams.includes(keys[i])) {
                    status = false;
                    break;
                }
                else {
                    status = true;
                }
            }
            if (!status) {
                return res.status(400).send({
                    status: false,
                    message: `Only these Query Params are allowed [${requiredParams.join(", ")}]`
                });
            }

            let queryData = {};
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] == 'size') {
                    queryData.availableSizes = data.size;
                }
                else if (keys[i] == 'name') {
                    queryData.title = {
                        $regex: new RegExp(`${data.name}`)
                    };
                }
                else if (keys[i] == 'priceGreaterThan') {
                    queryData.price = {
                        $gt: data.priceGreaterThan
                    }
                }
                else if (keys[i] == 'priceLessThan') {
                    queryData.price = {
                        $lt: data.priceLessThan
                    }
                }
            }
            if (data['priceGreaterThan'] && data['priceLessThan']) {
                queryData.price = {
                    $gt: data.priceGreaterThan,
                    $lt: data.priceLessThan
                }
            }
            queryData.isDeleted = false;
            queryData.deletedAt = null;

            const filterData = await productSchema.find(queryData).sort({
                price: 1
            });
            if (filterData.length == 0) {
                return res.status(404).send({
                    status: false,
                    message: 'Product not found !'
                });
            }

            return res.status(200).send({
                status: true,
                message: 'fetch success',
                count: filterData.length,
                data: filterData
            });

        }
        else {
            const fetchAllProducts = await productSchema.find({
                isDeleted: false,
                deletedAt: null
            }).sort({
                price: 1
            });
            if (fetchAllProducts.length == 0) {
                return res.status(404).send({
                    status: false,
                    message: 'Product not found !'
                });
            }
            return res.status(200).send({
                status: true,
                message: 'fetch success',
                count: fetchAllProducts.length,
                data: fetchAllProducts
            });
        }
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

const getProductById = async (req, res) => {
    try {
        const productId = req.params.productId;
        if (!handleObjectId(productId)) {
            return res.status(400).send({
                status: false,
                message: 'Only mongodb object id is allowed !'
            });
        }
        const productRes = await productSchema.findById(productId);
        if (!productRes) {
            return res.status(404).send({
                status: false,
                message: 'Product not found !'
            });
        }
        if (productRes.isDeleted && productRes.deletedAt != null) {
            return res.status(404).send({
                status: false,
                message: 'Product not found !'
            });
        }

        return res.status(200).send({
            status: true,
            message: "Success",
            data: productRes
        });

    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

const updateProductById = async (req, res) => {
    try {
        const productId = req.params.productId;
        const data = req.body;
        const keys = Object.keys(data);
        const file = req.files;

        if (!handleObjectId(productId)) {
            return res.status(400).send({
                status: false,
                message: 'Only mongodb object id is allowed !'
            });
        }
        const productRes = await productSchema.findById(productId);
        if (!productRes) {
            return res.status(404).send({
                status: false,
                message: 'Product not found !'
            });
        }
        if (productRes.isDeleted && productRes.deletedAt != null) {
            return res.status(404).send({
                status: false,
                message: 'Product not found !'
            });
        }
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] == '_id') {
                return res.status(400).send({
                    status: false,
                    message: 'You are not able to update _id property'
                });
            }
            else {
                if (keys[i] == 'availableSizes') {
                    for (let j = 0; j < data[keys[i]].length; j++) {
                        if (data[keys[i]][j].trim() == '') {
                            return res.status(400).send({
                                status: false,
                                message: `availableSizes should not be empty !`
                            });
                        }
                        else {
                            const defaultSize = ["S", "XS", "M", "X", "L", "XXL", "XL"];
                            if (data.availableSizes.length > 0) {
                                let status = false;
                                for (let i = 0; i < data.availableSizes.length; i++) {
                                    if (!defaultSize.includes(data.availableSizes[i])) {
                                        status = false;
                                        break;
                                    }
                                    else {
                                        status = true;
                                    }
                                }
                                if (!status) {
                                    return res.status(400).send({
                                        status: false,
                                        message: `Only these Query Params are allowed [${defaultSize.join(", ")}]`
                                    });
                                }
                            }
                        }
                    }
                }
                else {
                    if (data[keys[i]].trim() == '') {
                        return res.status(400).send({
                            status: false,
                            message: `${keys[i]} should not be empty !`
                        });
                    }
                }

            }
        }
        if (file && file.length > 0) {
            if (file[0].mimetype.indexOf('image') == -1) {
                return res.status(400).send({
                    status: false,
                    message: 'Only image files are allowed !'
                });
            }
            const profile_url = await awsService.uploadFile(file[0]);
            data.productImage = profile_url;
        }
        const updateRes = await productSchema.findByIdAndUpdate(productId, data, {
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
const deleteProductById = async (req, res) => {
    try {
        const productId = req.params.productId;

        if (!handleObjectId(productId)) {
            return res.status(400).send({
                status: false,
                message: 'Only mongodb object id is allowed !'
            });
        }
        const productRes = await productSchema.findById(productId);
        if (!productRes) {
            return res.status(404).send({
                status: false,
                message: 'Product not found !'
            });
        }
        if (productRes.isDeleted && productRes.deletedAt != null) {
            return res.status(404).send({
                status: false,
                message: 'Product not found !'
            });
        }

        const deleteRes = await productSchema.findByIdAndUpdate(productId, {
            isDeleted: true,
            deletedAt: new Date()
        }, {
            new: true
        });
        return res.status(200).send({
            status: true,
            message: `Delete success`,
            data: deleteRes
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}
module.exports = {
    createProduct,
    getProudcts,
    getProductById,
    updateProductById,
    deleteProductById
}
