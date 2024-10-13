import request from 'supertest';
import express from 'express';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import * as orderController from '../controllers/orderController.js';

const app = express();
app.use(express.json());

app.post('/placeOrder', orderController.placeOrder);
app.post('/verifyOrder', orderController.verifyOrder);
app.post('/userOrders', orderController.userOrders);
app.get('/listOrders', orderController.listOrders);
app.post('/updateStatus', orderController.updateStatus);

jest.mock('../models/orderModel.js');
jest.mock('../models/userModel.js');
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        checkout: {
            sessions: {
                create: jest.fn().mockResolvedValue({ url: 'http://checkout.stripe.com/session' })
            }
        }
    }));
});

describe('Order Controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('placeOrder', () => {
        it('should place an order and return Stripe session URL', async () => {
            const mockOrder = {
                userId: 'user123',
                items: [{ name: 'item1', price: 100, quantity: 1 }],
                amount: 120,
                address: '123 Main St'
            };

            orderModel.prototype.save = jest.fn().mockResolvedValue(mockOrder);
            userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});
            
            const response = await request(app)
                .post('/placeOrder')
                .send(mockOrder);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.session_url).toBe('http://checkout.stripe.com/session');
            expect(orderModel.prototype.save).toHaveBeenCalledTimes(1);
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user123', { cartData: {} });
        });

        it('should handle errors during order placement', async () => {
            orderModel.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));
            
            const response = await request(app)
                .post('/placeOrder')
                .send({
                    userId: 'user123',
                    items: [],
                    amount: 0,
                    address: '123 Main St'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
            expect(orderModel.prototype.save).toHaveBeenCalledTimes(1);
        });
    });

    describe('verifyOrder', () => {
        it('should verify payment and mark the order as paid', async () => {
            orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});
            
            const response = await request(app)
                .post('/verifyOrder')
                .send({ orderId: 'order123', success: 'true' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Paid');
            expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith('order123', { payment: true });
        });

        it('should delete the order if payment failed', async () => {
            orderModel.findByIdAndDelete = jest.fn().mockResolvedValue({});

            const response = await request(app)
                .post('/verifyOrder')
                .send({ orderId: 'order123', success: 'false' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Not Paid');
            expect(orderModel.findByIdAndDelete).toHaveBeenCalledWith('order123');
        });
    });

    describe('userOrders', () => {
        it('should retrieve user orders', async () => {
            const mockOrders = [{ _id: 'order123', items: [], amount: 120 }];
            orderModel.find = jest.fn().mockResolvedValue(mockOrders);

            const response = await request(app)
                .post('/userOrders')
                .send({ userId: 'user123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockOrders);
            expect(orderModel.find).toHaveBeenCalledWith({ userId: 'user123' });
        });

        it('should handle errors when retrieving user orders', async () => {
            orderModel.find = jest.fn().mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/userOrders')
                .send({ userId: 'user123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
            expect(orderModel.find).toHaveBeenCalledTimes(1);
        });
    });

    describe('listOrders', () => {
        it('should list all orders for admin', async () => {
            const mockOrders = [{ _id: 'order123', items: [], amount: 120 }];
            orderModel.find = jest.fn().mockResolvedValue(mockOrders);

            const response = await request(app)
                .get('/listOrders');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockOrders);
            expect(orderModel.find).toHaveBeenCalledWith({});
        });

        it('should handle errors when listing orders', async () => {
            orderModel.find = jest.fn().mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/listOrders');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('updateStatus', () => {
        it('should update order status', async () => {
            orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

            const response = await request(app)
                .post('/updateStatus')
                .send({ orderId: 'order123', status: 'delivered' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Status Updated');
            expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith('order123', { status: 'delivered' });
        });

        it('should handle errors when updating order status', async () => {
            orderModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/updateStatus')
                .send({ orderId: 'order123', status: 'delivered' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
        });
    });

});
