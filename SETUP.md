# How to Run This Project

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** (optional, for version control)

---

## Initial Setup

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required Node.js packages including Fastify, Prisma, BullMQ, and more.

---

### 2. Start Infrastructure Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

This command starts:
- **PostgreSQL** database on port `5432`
- **Redis** server on port `6379`

**Verify containers are running:**
```bash
docker ps
```

You should see two containers: `postgres:15-alpine` and `redis:7-alpine`

---

### 3. Configure Environment Variables

The `.env` file is already configured with:
```env
DATABASE_URL="postgresql://postgres:Arora@1976@localhost:5432/dex_backend?schema=public"
REDIS_HOST="localhost"
REDIS_PORT="6379"
PORT=3000
```

> **Note:** If you need to change the database password or ports, update this file accordingly.

---

### 4. Setup Database Schema

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the database schema
- Generate Prisma Client for type-safe database access

**Optional:** View your database with Prisma Studio:
```bash
npx prisma studio
```

---

### 5. Start the Development Server

Run the application in development mode with hot reload:

```bash
npm run dev
```

You should see output like:
```
Server listening on http://localhost:3000
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with auto-reload (uses nodemon) |
| `npm run build` | Compile TypeScript to JavaScript in `dist/` folder |
| `npm start` | Run production build from `dist/` folder |
| `npm test` | Run Jest test suite |

---

## API Endpoints

Once the server is running, you can interact with these endpoints:

### 1. Execute Order
**POST** `http://localhost:3000/api/orders/execute`

**Request Body:**
```json
{
  "walletAddress": "YourSolanaWalletAddress",
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 1.5,
  "slippage": 0.5
}
```

### 2. WebSocket Connection
**WS** `ws://localhost:3000/ws`

Connect and subscribe to order updates:
```json
{
  "type": "SUBSCRIBE",
  "orderId": "your-order-id"
}
```

---

## Testing the Application

### Using cURL

```bash
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "test123",
    "inputToken": "SOL",
    "outputToken": "USDC",
    "amount": 1.0,
    "slippage": 0.5
  }'
```

### Using Postman

Import the `postman_collection.json` file included in the project for pre-configured API requests.

---

## Troubleshooting

### Redis Connection Error: `ECONNREFUSED ::1:6379`

**Solution:** Make sure Docker containers are running:
```bash
docker-compose up -d
```

Verify Redis is running:
```bash
docker ps | grep redis
```

---

### Database Connection Error

**Solution:** Ensure PostgreSQL is running and credentials match:
```bash
docker-compose up -d postgres
```

Check the `DATABASE_URL` in `.env` matches your Docker configuration.

---

### Port Already in Use

If port 3000 is already in use, change it in `.env`:
```env
PORT=3001
```

Then restart the server.

---

### TypeScript Errors

Rebuild the project:
```bash
npm run build
```

Regenerate Prisma Client:
```bash
npx prisma generate
```

---

## Stopping the Application

### Stop Development Server
Press `Ctrl + C` in the terminal running `npm run dev`

### Stop Docker Containers
```bash
docker-compose down
```

### Stop and Remove Volumes (Clean Reset)
```bash
docker-compose down -v
```

---

## Project Structure

```
d:/Eterna Backend/
├── src/
│   ├── api/          # Fastify server and routes
│   ├── db/           # Prisma client configuration
│   ├── queue/        # BullMQ job queue setup
│   ├── services/     # Business logic (order processing)
│   ├── ws/           # WebSocket handlers
│   └── utils/        # Logger and utilities
├── prisma/           # Database schema and migrations
├── .env              # Environment variables
├── docker-compose.yml # Docker services configuration
├── package.json      # Node.js dependencies
└── tsconfig.json     # TypeScript configuration
```

---

## Production Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Set Environment Variables
Update `.env` for production (use secure passwords, remote database URLs, etc.)

### 3. Run Production Server
```bash
npm start
```

### 4. Use Process Manager (Recommended)
```bash
npm install -g pm2
pm2 start dist/api/server.js --name "dex-backend"
pm2 save
pm2 startup
```

---

## Additional Resources

- **Fastify Documentation:** https://www.fastify.io/
- **Prisma Documentation:** https://www.prisma.io/docs
- **BullMQ Documentation:** https://docs.bullmq.io/
- **Docker Documentation:** https://docs.docker.com/

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs in the terminal
3. Check Docker container logs: `docker-compose logs`

---

**Happy Coding! 🚀**
