const express = require('express');
const createRateLimiter = require('./index');
const Redis = require('ioredis');

const app = express();

const redisClient = new Redis('redis://connectionstring', {
    password: 'redispassword' || undefined,
    connectTimeout: 5000,
    maxRetriesPerRequest: null,
  })

const rateLimiter = createRateLimiter({
    redisClient,
    bucketSize: 10,
    refillRate: 1, // 2 tokens per second
});

app.use(rateLimiter);

app.get('/', (req, res) => {
    res.send('Welcome to the rate-limited API!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
