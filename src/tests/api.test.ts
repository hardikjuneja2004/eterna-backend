import fastify from 'fastify';
import { orderRoutes } from '../api/routes/orders';
import { registerWebsocket } from '../ws/socketHandler';
import websocket from '@fastify/websocket';

describe('API Routes', () => {
    let server: any;

    beforeAll(async () => {
        server = fastify();
        server.register(websocket);
        server.register(orderRoutes);
        registerWebsocket(server);
    });

    afterAll(async () => {
        await server.close();
    });

    test('POST /orders/execute should create order', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/orders/execute',
            payload: {
                inputToken: 'SOL',
                outputToken: 'USDC',
                amount: 1,
            },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toHaveProperty('orderId');
        expect(body.status).toBe('pending');
    });

    test('POST /orders/execute should validate input', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/orders/execute',
            payload: {
                inputToken: '',
                outputToken: 'USDC',
                amount: -1,
            },
        });

        expect(response.statusCode).toBe(400);
    });
});
