import fastify from 'fastify';
import websocket from '@fastify/websocket';
import { orderRoutes } from './routes/orders';
import { registerWebsocket } from '../ws/socketHandler';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const server = fastify({ logger: false });

const start = async () => {
    try {
        // Register WebSocket plugin first
        await server.register(websocket);

        // Register routes
        await server.register(orderRoutes, { prefix: '/api' });

        // Register WebSocket handler
        await registerWebsocket(server);

        const port = parseInt(process.env.PORT || '3000');
        await server.listen({ port, host: '0.0.0.0' });
        logger.info(`Server running on port ${port}`);
        logger.info(`WebSocket available at ws://localhost:${port}/ws`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
