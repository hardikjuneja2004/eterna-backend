# Solana DEX Backend

A robust backend system for a Solana DEX routing and order execution engine.

## Features
- **Market Order Execution**: Real-time routing between Raydium and Meteora.
- **WebSocket Streaming**: Live updates of order status (pending -> routing -> confirmed).
- **Queue System**: BullMQ with Redis for concurrency control and retries.
- **Database**: PostgreSQL with Prisma ORM for persistence.

## Architecture
- **API**: Fastify (Node.js + TypeScript)
- **Queue**: BullMQ + Redis
- **DB**: PostgreSQL + Prisma
- **Testing**: Jest

## Design Decisions
- **Market Order**: Chosen for simplicity and speed in execution.
- **Extensibility**: Limit and Sniper orders can be added by introducing a "trigger" mechanism in the queue worker that checks conditions before processing.
- **WebSocket**: Used for real-time feedback to the user without polling.

## Setup
1. **Prerequisites**: Docker, Node.js 18+
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start Infrastructure**:
   ```bash
   docker-compose up -d
   ```
4. **Database Setup**:
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Run Development Server**:
   ```bash
   npm run dev
   ```
6. **Run Tests**:
   ```bash
   npm test
   ```

## API Endpoints
- `POST /api/orders/execute`: Submit a new order.
- `WS /ws`: Connect for updates.

## Testing Guide (Postman)

### 1. WebSocket Connection
**URL:** `ws://localhost:3000/ws`
1. Open Postman -> New -> WebSocket Request.
2. Enter URL: `ws://localhost:3000/ws`.
3. Click **Connect**.

### 2. Create Order (via WebSocket)
Send this JSON message to create an order and automatically subscribe to updates:
```json
{
    "type": "CREATE_ORDER",
    "data": {
        "inputToken": "SOL",
        "outputToken": "USDC",
        "amount": 1
    }
}
```
**Expected Response:**
- `ORDER_CREATED` event with `orderId`.
- Followed by status updates: `pending` -> `routing` -> `building` -> `submitted` -> `confirmed`.

### 3. Subscribe to Existing Order
If you already have an `orderId`, send this JSON to track it:
```json
{
    "type": "SUBSCRIBE",
    "orderId": "YOUR_ORDER_ID_HERE"
}
```

### 4. Get Order Details (HTTP)
**URL:** `GET http://localhost:3000/api/orders/:id`
- Replace `:id` with the actual Order ID.
- Returns full order details and execution logs.
