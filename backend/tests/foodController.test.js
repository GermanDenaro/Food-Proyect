import request from 'supertest';
import express from 'express';
import foodModel from '../models/foodModel.js';
import { addFood, listFood, removeFood } from '../controllers/foodController.js';
import multer from 'multer'; // middleware de Node.js para manejar la carga de archivos en aplicaciones Express y Node.js
import fs from 'fs'; // File System - módulo nativo de Node.js que proporciona una API para interactuar con el sistema de archivos

jest.mock('../models/foodModel.js');
jest.mock('fs', () => ({
    unlink: jest.fn()
}));

const app = express();
app.use(express.json());
app.post('/food/add', multer().single('file'), addFood);
app.get('/food/list', listFood);
app.delete('/food/remove', removeFood);

describe('Food Controller', () => {

    describe('addFood', () => {
        test('should add a new food item', async () => {
            foodModel.prototype.save = jest.fn().mockResolvedValue({});

            const response = await request(app)
                .post('/food/add')
                .attach('file', Buffer.from(''), 'test_image.png')
                .field('name', 'Pizza')
                .field('description', 'Delicious pizza')
                .field('price', 10)
                .field('category', 'Fast food');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Food Added');
            expect(foodModel.prototype.save).toHaveBeenCalled();
        });

        test('should return an error when saving food fails', async () => {
            foodModel.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/food/add')
                .attach('file', Buffer.from(''), 'test_image.png')
                .field('name', 'Pizza')
                .field('description', 'Delicious pizza')
                .field('price', 10)
                .field('category', 'Fast food');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
            expect(foodModel.prototype.save).toHaveBeenCalled();
        });
    });

    describe('listFood', () => {
        test('should return a list of food items', async () => {
            const mockFoods = [
                { name: 'Pizza', description: 'Delicious pizza', price: 10, category: 'Fast food' },
                { name: 'Burger', description: 'Tasty burger', price: 5, category: 'Fast food' }
            ];

            foodModel.find.mockResolvedValue(mockFoods);

            const response = await request(app).get('/food/list');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockFoods);
            expect(foodModel.find).toHaveBeenCalled();
        });

        test('should return an error when fetching the food list fails', async () => {
            foodModel.find.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/food/list');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
            expect(foodModel.find).toHaveBeenCalled();
        });
    });

    describe('removeFood', () => {
        test('should remove a food item and delete its image', async () => {
            const mockFood = { _id: 'food123', image: 'test_image.png' };

            foodModel.findById.mockResolvedValue(mockFood);
            foodModel.findByIdAndDelete.mockResolvedValue(mockFood);

            const response = await request(app)
                .delete('/food/remove')
                .send({ id: 'food123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Food Removed');
            expect(foodModel.findById).toHaveBeenCalledWith('food123');
            expect(foodModel.findByIdAndDelete).toHaveBeenCalledWith('food123');
            expect(fs.unlink).toHaveBeenCalledWith('uploads/test_image.png', expect.any(Function));
        });

        test('should return an error when food removal fails', async () => {
            foodModel.findById.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .delete('/food/remove')
                .send({ id: 'food123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
            expect(foodModel.findById).toHaveBeenCalledWith('food123');
        });
    });
});
