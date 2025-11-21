import prisma from '../db/prisma';
import { DexRouter } from '../router/dexRouter';
import { logger } from '../utils/logger';
import { broadcastOrderUpdate } from '../ws/socketHandler';

export class OrderService {
    private router: DexRouter;

    constructor() {
        this.router = new DexRouter();
    }

    async createOrder(inputToken: string, outputToken: string, amount: number) {
        const order = await prisma.userOrder.create({
            data: {
                status: 'pending',
                inputToken,
                outputToken,
                amount,
            },
        });
        return order;
    }

    async getOrder(orderId: string) {
        const order = await prisma.userOrder.findUnique({
            where: { id: orderId },
            include: {
                logs: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });
        return order;
    }

    async processOrder(orderId: string) {
        try {
            await this.updateStatus(orderId, 'routing', 'Starting routing process...');

            // Add delay to see routing status
            await new Promise(resolve => setTimeout(resolve, 1500));

            const order = await prisma.userOrder.findUnique({ where: { id: orderId } });
            if (!order) throw new Error('Order not found');

            const quote = await this.router.getBestQuote(order.inputToken, order.outputToken, order.amount);

            await prisma.executionLog.create({
                data: {
                    orderId,
                    message: `Selected ${quote.dex} with price ${quote.price}`,
                },
            });

            await this.updateStatus(orderId, 'building', `Building transaction for ${quote.dex}...`);

            // Simulate building transaction
            await new Promise(resolve => setTimeout(resolve, 1500));

            await this.updateStatus(orderId, 'submitted', 'Transaction submitted to network...');

            // Add delay before execution
            await new Promise(resolve => setTimeout(resolve, 1500));

            const txHash = await this.router.executeSwap(quote);

            await prisma.userOrder.update({
                where: { id: orderId },
                data: {
                    status: 'confirmed',
                    result: { txHash, quote } as any,
                },
            });

            // Log confirmation
            await prisma.executionLog.create({
                data: {
                    orderId,
                    message: `Order confirmed. TxHash: ${txHash}`,
                },
            });

            broadcastOrderUpdate(orderId, { status: 'confirmed', txHash });
            logger.info(`Order ${orderId} confirmed: ${txHash}`);

        } catch (error: any) {
            logger.error(`Order processing failed: ${error.message}`);
            throw error; // Let BullMQ handle retry
        }
    }

    async handleJobFailure(orderId: string, reason: string) {
        await prisma.userOrder.update({
            where: { id: orderId },
            data: {
                status: 'failed',
                result: { error: reason },
            },
        });

        await prisma.executionLog.create({
            data: {
                orderId,
                message: `Order failed: ${reason}`,
            },
        });

        broadcastOrderUpdate(orderId, { status: 'failed', error: reason });
    }

    private async updateStatus(orderId: string, status: string, message?: string) {
        await prisma.userOrder.update({
            where: { id: orderId },
            data: { status },
        });

        if (message) {
            await prisma.executionLog.create({
                data: {
                    orderId,
                    message,
                },
            });
        }

        broadcastOrderUpdate(orderId, { status });
    }
}
