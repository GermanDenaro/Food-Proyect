import request from 'supertest';
import express from 'express';
import { addToCart, removeFromCart, getCart } from '../controllers/cartController.js';
import userModel from '../models/userModel.js';

const app = express();
app.use(express.json());

app.post('/cart/add', addToCart);
app.post('/cart/remove', removeFromCart);
app.post('/cart/get', getCart);

jest.mock('../models/userModel.js'); // Simulamos el modelo de usuario

describe('Cart Controller', () => {
    const userId = 'user123'; // ID de usuario de prueba

    beforeEach(() => {
        jest.clearAllMocks(); // Limpia los mocks entre pruebas
    });

    test('should add item to cart when not in cart', async () => {
        userModel.findById.mockResolvedValue({
            _id: userId,
            cartData: {} // El carrito comienza vacío
        });

        userModel.findByIdAndUpdate.mockResolvedValue();

        const response = await request(app)
            .post('/cart/add')
            .send({ userId, itemId: 'item123' });

        expect(response.status).toBe(200); // Comprobamos que la respuesta es exitosa
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Added to cart');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            userId,
            { cartData: { 'item123': 1 } },
        );
    });

    test('should increase item quantity if already in cart', async () => {
        userModel.findById.mockResolvedValue({
            _id: userId,
            cartData: { 'item123': 2 }
        });

        userModel.findByIdAndUpdate.mockResolvedValue();

        const response = await request(app)
            .post('/cart/add')
            .send({ userId, itemId: 'item123' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Added to cart');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            userId,
            { cartData: { 'item123': 3 } },
        );
    });

    test('should remove item from cart', async () => {
        userModel.findById.mockResolvedValue({
            _id: userId,
            cartData: { 'item123': 2 }
        });

        userModel.findByIdAndUpdate.mockResolvedValue();

        const response = await request(app)
            .post('/cart/remove')
            .send({ userId, itemId: 'item123' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Removed from cart');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            userId,
            { cartData: { 'item123': 1 } },
        );
    });

    test('should fetch cart data for user', async () => {
        userModel.findById.mockResolvedValue({
            _id: userId,
            cartData: { 'item123': 2 }
        });

        const response = await request(app)
            .post('/cart/get')
            .send({ userId });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.cartData).toEqual({ 'item123': 2 });
    });

    test('should return error when something goes wrong', async () => {
        userModel.findById.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .post('/cart/add')
            .send({ userId, itemId: 'item123' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Error');
    });
});
