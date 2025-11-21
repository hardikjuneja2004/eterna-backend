import { FastifyInstance } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { logger } from '../utils/logger';
import prisma from '../db/prisma';
import { OrderService } from '../services/orderService';
import { orderQueue } from '../queue/orderQueue';

// Map to store active connections: orderId -> WebSocket
const connections = new Map<string, any>();

export const registerWebsocket = async (fastify: FastifyInstance) => {
    fastify.get('/ws', { websocket: true }, (connection: SocketStream, req) => {
        logger.info('New WebSocket connection');

        connection.socket.on('message', async (message: string) => {
            try {
                const messageData = JSON.parse(message.toString());

                if (messageData.type === 'CREATE_ORDER') {
                    const { inputToken, outputToken, amount } = messageData.data;

                    // Basic validation
                    if (!inputToken || !outputToken || !amount) {
                        connection.socket.send(JSON.stringify({ type: 'ERROR', message: 'Invalid order data' }));
                        return;
                    }

                    const orderService = new OrderService();
                    const order = await orderService.createOrder(inputToken, outputToken, amount);

                    // Subscribe immediately
                    logger.info(`WS Order created & subscribed: ${order.id}`);
                    connections.set(order.id, connection.socket);

                    // Send confirmation
                    connection.socket.send(JSON.stringify({
                        type: 'ORDER_CREATED',
                        orderId: order.id,
                        status: 'pending'
                    }));

                    // Add to queue
                    await orderQueue.add('process-order', { orderId: order.id }, {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 1000 },
                        delay: 2000 // Short delay to ensure client is ready
                    });
                }
                else if (messageData.type === 'SUBSCRIBE' && messageData.orderId) {
                    logger.info(`Subscribing to order ${messageData.orderId}`);
                    connections.set(messageData.orderId, connection.socket);
                    connection.socket.send(JSON.stringify({ type: 'SUBSCRIBED', orderId: messageData.orderId }));

                    // Send current order status immediately
                    const order = await prisma.userOrder.findUnique({ where: { id: messageData.orderId } });
                    if (order) {
                        connection.socket.send(JSON.stringify({
                            status: order.status,
                            orderId: messageData.orderId,
                            result: order.result
                        }));
                        logger.info(`Sent current status for ${messageData.orderId}: ${order.status}`);
                    }
                }
            } catch (err) {
                logger.error('Failed to parse WS message');
            }
        });

        connection.socket.on('close', () => {
            // Cleanup connections
            for (const [orderId, socket] of connections.entries()) {
                if (socket === connection.socket) {
                    connections.delete(orderId);
                    logger.info(`Unsubscribed from order ${orderId}`);
                }
            }
        });
    });
};

export const broadcastOrderUpdate = (orderId: string, data: any) => {
    const socket = connections.get(orderId);
    if (socket && socket.readyState === 1) { // OPEN
        socket.send(JSON.stringify(data));
        logger.info(`Broadcasted update for ${orderId}: ${data.status}`);
    }
};
