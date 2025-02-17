import request from 'supertest';
import express from 'express';
import userModel from '../models/userModel.js';
import * as authController from '../controllers/userController.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

app.post('/login', authController.loginUser);
app.post('/register', authController.registerUser);

jest.mock('../models/userModel.js');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loginUser', () => {
        it('should log in the user with valid credentials', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'hashedPassword123'
            };

            userModel.findOne = jest.fn().mockResolvedValue(mockUser);
            bcryptjs.compare = jest.fn().mockResolvedValue(true);
            jwt.sign = jest.fn().mockReturnValue('fakeToken');

            const response = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBe('fakeToken');
            expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(bcryptjs.compare).toHaveBeenCalledWith('password123', mockUser.password);
            expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser._id }, process.env.JWT_SECRET);
        });

        it('should return an error if the user does not exist', async () => {
            userModel.findOne = jest.fn().mockResolvedValue(null);

            const response = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User does not exist.');
            expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('should return an error if the password is incorrect', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'hashedPassword123'
            };

            userModel.findOne = jest.fn().mockResolvedValue(mockUser);
            bcryptjs.compare = jest.fn().mockResolvedValue(false);

            const response = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'wrongPassword' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid credentials');
            expect(bcryptjs.compare).toHaveBeenCalledWith('wrongPassword', mockUser.password);
        });

        it('should return an error if there is an exception during login', async () => {
            // Simular que userModel.findOne lanza un error
            userModel.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
        
            const response = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'password123' });
        
            expect(response.status).toBe(200); // Asegurarse que Express no lance un error
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
        });
        
    });

    describe('registerUser', () => {
        it('should register a new user with valid data', async () => {
            userModel.findOne = jest.fn().mockResolvedValue(null);
            bcryptjs.genSalt = jest.fn().mockResolvedValue('salt123');
            bcryptjs.hash = jest.fn().mockResolvedValue('hashedPassword123');
            jwt.sign = jest.fn().mockReturnValue('fakeToken');
            userModel.prototype.save = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com'
            });

            const response = await request(app)
                .post('/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBe('fakeToken');
            expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(bcryptjs.hash).toHaveBeenCalledWith('password123', 'salt123');
            expect(jwt.sign).toHaveBeenCalledWith({ id: 'user123' }, process.env.JWT_SECRET);
        });

        it('should return an error if the email is already registered', async () => {
            userModel.findOne = jest.fn().mockResolvedValue({ email: 'test@example.com' });

            const response = await request(app)
                .post('/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User already exists.');
            expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('should return an error if the email is invalid', async () => {
            const response = await request(app)
                .post('/register')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Please enter a valid email.');
        });

        it('should return an error if the password is too short', async () => {
            const response = await request(app)
                .post('/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'short'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Password must contain 8 characters or more.');
        });
        it('should return an error if there is an exception when checking if the user exists', async () => {
            // Simular que userModel.findOne lanza un error
            userModel.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
        
            const response = await request(app)
                .post('/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });
        
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
        });

        it('should return an error if there is an exception when hashing the password', async () => {
            // Simular que bcryptjs.hash lanza un error
            userModel.findOne = jest.fn().mockResolvedValue(null); // Simular que el usuario no existe
            bcryptjs.genSalt = jest.fn().mockResolvedValue('salt123');
            bcryptjs.hash = jest.fn().mockRejectedValue(new Error('Hashing error'));
        
            const response = await request(app)
                .post('/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });
        
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
        });

        it('should return an error if there is an exception when saving the user', async () => {
            // Simular que bcryptjs.hash funciona pero guardar el usuario falla
            userModel.findOne = jest.fn().mockResolvedValue(null); // Simular que el usuario no existe
            bcryptjs.genSalt = jest.fn().mockResolvedValue('salt123');
            bcryptjs.hash = jest.fn().mockResolvedValue('hashedPassword123');
            userModel.prototype.save = jest.fn().mockRejectedValue(new Error('Save error'));
        
            const response = await request(app)
                .post('/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });
        
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error');
        });
    
    });
});
