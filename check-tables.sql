-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Count records in UserOrder
SELECT COUNT(*) as total_orders FROM "UserOrder";

-- Show last 5 orders
SELECT id, status, "inputToken", "outputToken", amount, "createdAt" 
FROM "UserOrder" 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Count records in ExecutionLog  
SELECT COUNT(*) as total_logs FROM "ExecutionLog";

-- Show last 5 logs
SELECT id, "orderId", message, timestamp 
FROM "ExecutionLog" 
ORDER BY timestamp DESC 
LIMIT 5;
