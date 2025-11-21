import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { OrderService } from '../services/orderService';
import { logger } from '../utils/logger';

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

export const orderQueue = new Queue('order-processing', { connection });

const worker = new Worker(
    'order-processing',
    async (job: Job) => {
        const { orderId } = job.data;
        logger.info(`Processing order ${orderId}`);
        const orderService = new OrderService();
        await orderService.processOrder(orderId);
    },
    {
        connection,
        concurrency: 10,
        limiter: {
            max: 100,
            duration: 60000, // 1 minute
        },
    }
);

worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
});

worker.on('failed', async (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
    if (job) {
        const orderService = new OrderService();
        // If retries exhausted, mark as failed
        if (job.attemptsMade >= (job.opts.attempts || 3)) {
            await orderService.handleJobFailure(job.data.orderId, err.message);
        }
    }
});

export { worker };
