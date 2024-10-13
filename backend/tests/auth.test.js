import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/auth.js';

const app = express();
app.use(express.json());

app.get('/protected', authMiddleware, (req, res) => {
    res.json({ success: true, message: 'Access granted', userId: req.body.userId });
});

describe('Auth Middleware', () => {
    const JWT_SECRET = 'test_secret'; // Se crea un token de prueba

    beforeEach(() => {
        process.env.JWT_SECRET = JWT_SECRET;
    });

    test('should deny access when no token is provided', async () => {
        const response = await request(app).get('/protected');
        expect(response.status).toBe(401); // El usuario no tiene token o no esta autenticado
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Not Authorized, Login Again");
    });

    test('should deny access when invalid token is provided', async () => {
        const response = await request(app)
            .get('/protected')
            .set('token', 'invalid_token'); // Token inválido

        expect(response.status).toBe(500); // Falla la verificación del token
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Error");
    });

    test('should grant access with valid token', async () => {
        const validToken = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });

        const response = await request(app)
            .get('/protected')
            .set('token', validToken);

        expect(response.status).toBe(200); // Token exitoso
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Access granted");
        expect(response.body.userId).toBe('user123');
    });
});
