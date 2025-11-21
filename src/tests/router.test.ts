import { DexRouter } from '../router/dexRouter';

describe('DexRouter', () => {
    let router: DexRouter;

    beforeEach(() => {
        router = new DexRouter();
    });

    test('should return a quote from either Raydium or Meteora', async () => {
        const quote = await router.getBestQuote('SOL', 'USDC', 1);
        expect(['Raydium', 'Meteora']).toContain(quote.dex);
        expect(quote.price).toBeGreaterThan(0);
        expect(quote.estimatedOutput).toBeGreaterThan(0);
    });

    test('should execute swap and return tx hash', async () => {
        const quote = { dex: 'Raydium', price: 100, estimatedOutput: 100 } as any;
        const txHash = await router.executeSwap(quote);
        expect(txHash).toMatch(/^MOCK_TX_/);
    });
});
