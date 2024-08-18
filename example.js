const express = require('express');
const Redis = require('ioredis');
const {createRateLimiter} = require('nodejs-rate-limiter-redis')
const app = express();

const redisClient = new Redis('YOUR_REDIS_URL', {
    password: 'YOUR_REDIS_PASS' || undefined,
    connectTimeout: 5000,
    maxRetriesPerRequest: null,
  })

const rateLimiter = createRateLimiter({
    redisClient,     // Default :- Uses process/serevr memory if not passed ( Not recommended )
    bucketSize: 10, // Initial Bucket Size
    refillRate: 1, //  Tokens added per second,
    message: "You have reached todays limit" ,
    skip: false, // Bypass Rate Limiting , determine whether or not this request consumes token from client’s bucket
});

app.use(rateLimiter);

app.get('/', (req, res) => {
    res.send('Welcome to the rate-limited API!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
