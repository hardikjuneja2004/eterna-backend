import prisma from './src/db/prisma';

async function checkDatabase() {
    console.log('\n📊 Checking PostgreSQL Database...\n');

    // Get all orders
    const orders = await prisma.userOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log(`✅ Found ${orders.length} orders in database:\n`);

    orders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order.id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Trade: ${order.amount} ${order.inputToken} → ${order.outputToken}`);
        console.log(`   Created: ${order.createdAt}`);
        if (order.result) {
            const result = order.result as any;
            if (result.txHash) {
                console.log(`   TxHash: ${result.txHash}`);
            }
            if (result.quote) {
                console.log(`   DEX: ${result.quote.dex} @ ${result.quote.price}`);
            }
        }
        console.log('');
    });

    // Get execution logs
    const logs = await prisma.executionLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10
    });

    console.log(`\n📝 Found ${logs.length} execution logs:\n`);

    logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.message}`);
        console.log(`   Order ID: ${log.orderId}`);
        console.log(`   Time: ${log.timestamp}\n`);
    });

    await prisma.$disconnect();
}

checkDatabase().catch(console.error);
