const orderSchema = require('../model/order.model');
const mongoose = require('mongoose');

const handleObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}

const createOrder = async (req, res) => {
    try {
        const data = req.body;
        const { items } = data;
        const keys = Object.keys(data);
        if (keys.length == 0) {
            return res.status(400).send({
                status: false,
                message: "Body should not be an empty"
            });
        }

        let totalQuantity = 0;
        items.forEach((productObj) => {
            totalQuantity += productObj.quantity;
        });
        data.totalQuantity = totalQuantity;

        const orderRes = await orderSchema.create(data);
        return res.status(201).send({
            status: true,
            message: "Order placed success",
            data: orderRes
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

const updateOrder = async (req, res) => {
    try {
        const data = req.body;
        const requiredParams = ['orderId', 'status'];
        for (let i = 0; i < requiredParams.length; i++) {
            if (!data[requiredParams[i]] || !data[requiredParams[i]].trim()) {
                return res.status(400).send({
                    status: false,
                    message: `${requiredParams[i]} field is required`
                });
            }
        }
        if (!handleObjectId(data.orderId)) {
            return res.status(400).send({
                status: false,
                message: 'Only mongodb object id is allowed !'
            });
        }
        const orderRes = await orderSchema.findOne({
            _id: data.orderId,
            deletedAt: null,
            isDeleted: false
        });
        if (!orderRes) {
            return res.status(400).send({
                status: false,
                message: 'Order not found'
            });
        }
        const statusEnum = ['pending', 'completed', 'cancelled'];
        if (!statusEnum.includes(data.status)) {
            return res.status(400).send({
                status: false,
                message: `Only these params are allowed on status ${statusEnum.join(", ")}`
            });
        }
        if (data.status == "cancelled") {
            if (!orderRes.cancellable) {
                return res.status(400).send({
                    status: false,
                    message: 'You are not able to cancel your order'
                });
            }
        }
        if (orderRes.status == 'completed') {
            return res.status(200).send({
                status: true,
                message: 'Order is already completed'
            });
        }
        if (orderRes.status == 'cancelled') {
            return res.status(200).send({
                status: true,
                message: 'Order is already cancelled'
            });
        }
        const updateRes = await orderSchema.findByIdAndUpdate(data.orderId, {
            status: data.status
        },
            {
                new: true
            });
        return res.status(200).send({
            status: true,
            message: "status update success",
            data: updateRes
        });

    }
    catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

module.exports = {
    createOrder,
    updateOrder
}