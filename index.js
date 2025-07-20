const express = require('express');
const Redis = require('ioredis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Redis client with retry strategy
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {}),
  // Reconnect on disconnect with exponential backoff
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.log(`Retry attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
  // Optional: max retries before giving up
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('Connected to Redis Cloud'));
redis.on('error', (err) => console.error('Redis error:', err));

app.get('/', async (req, res) => {
  try {
    const visits = await redis.incr('visits');
    res.send(`<h1>Number of visits: ${visits}</h1>`);
  } catch (err) {
    console.error('Redis command error:', err);
    res.status(500).send('Oops! Something went wrong.');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
