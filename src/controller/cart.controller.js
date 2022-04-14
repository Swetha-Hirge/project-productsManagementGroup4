const cartSchema = require('../model/cart.model');
const productSchema = require('../model/product.model');
const mongoose = require('mongoose');

const handleObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}
const createCart = async (req, res) => {
    try {
        const data = req.body;
        const keys = Object.keys(data);
        let price = 0;

        if (!data.userId || data.userId.trim() == '') {
            return res.status(400).send({
                status: false,
                message: 'userId field is required'
            });
        }

        if (!handleObjectId(data.userId)) {
            return res.status(400).send({
                status: false,
                message: 'Only mongodb object id is allowed !'
            });
        }
        const requiredParams = ['userId', 'items'];
        for (let i = 0; i < keys.length; i++) {
            if (!requiredParams.includes(keys[i])) {
                return res.status(400).send({
                    status: false,
                    message: `Only these body params are allowed ${requiredParams.join(", ")}`
                });
            }
            else if (keys[i] == 'items') {
                if (!data['items']) {
                    return res.status(400).send({
                        status: false,
                        message: 'items field should not be empty'
                    });
                }
                else if (!(typeof data['items'] == 'object' && data['items'] !== null && !Array.isArray(data['items']))) {
                    return res.status(400).send({
                        status: false,
                        message: 'Only Object data are allowed'
                    });
                }

                if (!data['items']['productId'] || data['items']['productId'].trim() == '') {
                    return res.status(400).send({
                        status: false,
                        message: 'product Id is required'
                    });
                }

                if (!handleObjectId(data['items']['productId'])) {
                    return res.status(400).send({
                        status: false,
                        message: 'Only mongodb object id is allowed !'
                    });
                }
                const productRes = await productSchema.findOne({
                    '_id': data['items']['productId'],
                    isDeleted: false,
                    deletedAt: null
                });

                if (!productRes) {
                    return res.status(400).send({
                        status: false,
                        message: 'Product not found'
                    });
                }
                price = productRes.price;
            }
        }

        const fetchCart = await cartSchema.findOne({
            'userId': data.userId
        });
        if (fetchCart) {
            let status = false;
            const previousItems = [];
            for (let i = 0; i < fetchCart.items.length; i++) {
                if (fetchCart.items[i].productId == data.items.productId) {
                    status = true;
                    previousItems.push({
                        productId: fetchCart.items[i].productId,
                        quantity: fetchCart.items[i].quantity + (data.items.quantity || 1)
                    });
                    const dataRes = await cartSchema.findOneAndUpdate(
                        {
                            userId: data.userId
                        },
                        {
                            items: previousItems,
                            $inc: {
                                totalPrice: + price * (data.items.quantity || 1)
                            }
                        },
                        {
                            new: true
                        }
                    );
                    return res.status(201).send({
                        status: false,
                        message: "success",
                        data: dataRes
                    });
                }
                else {
                    status = false;
                    previousItems.push(fetchCart.items[i]);
                }
            }
            if (!status) {
                const appendItems = [...fetchCart.items, data.items];
                const updatedPrice = fetchCart.totalPrice + price * (data.items.quantity || 1);
                const dataRes = await cartSchema.findOneAndUpdate(
                    {
                        userId: data.userId
                    },
                    {
                        items: appendItems,
                        totalPrice: updatedPrice,
                        totalItems: appendItems.length
                    },
                    {
                        new: true
                    }
                );
                return res.status(201).send({
                    status: false,
                    message: "success",
                    data: dataRes
                });
            }
        }
        else {
            if (data['items'] != undefined) {
                data.totalItems = 1;
                const keys = Object.keys(data['items']);
                if (!keys.includes('quantity')) {
                    price = price;
                }
                else {
                    price = price * data.items.quantity;
                }
            }
            data.totalPrice = price
            const cartRes = await cartSchema.create(data);
            return res.status(201).send({
                status: false,
                message: "success",
                data: cartRes
            });
        }
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

const updateCart = async (req, res) => {
    try {
        const data = req.body;
        const keys = Object.keys(data);
        const requiredParams = ['cartId', 'productId', 'removeProduct'];

        for (let i = 0; i < keys.length; i++) {
            if (!requiredParams.includes(keys[i])) {
                return res.status(400).send({
                    status: false,
                    message: `Only these body params are allowed ${requiredParams.join(", ")}`
                });
            }
            if (!data[requiredParams[i]]) {
                return res.status(400).send({
                    status: false,
                    message: `${requiredParams[i]} field is required`
                });
            }
            if (keys[i] == 'cartId' || keys[i] == 'productId') {
                if (!handleObjectId(data[keys[i]])) {
                    return res.status(400).send({
                        status: false,
                        message: `Only mongodb object id is allowed on ${keys[i]} !`
                    });
                }
            }
        }

        const cartRes = await cartSchema.findById(data.cartId);
        if (!cartRes) {
            return res.status(400).send({
                status: false,
                message: 'Cart not found !'
            });
        }
        const previousItems = [];
        for (let i = 0; i < cartRes.items.length; i++) {
            if (cartRes.items[i].productId == data.productId) {
                previousItems.push({
                    productId: data.productId,
                    quantity: cartRes.items[i].quantity - 1
                });
            }
            else {
                previousItems.push(cartRes.items[i]);
            }
        }
        const reduceRes = await cartSchema.findOneAndUpdate({
            productId: data.productId
        }, {
            items: previousItems
        }, {
            new: true
        });
        res.send(reduceRes)



    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

module.exports = {
    createCart,
    updateCart
}