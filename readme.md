
<h1 align="center"> <code>nodejs-rate-limiter-redis</code> </h1>


A flexible rate limiter middleware for [Express](http://expressjs.com/) applications that supports both Redis and in-memory storage. The rate limiter uses the Token Bucket algorithm to control the rate of requests.


## Features

- **Token Bucket Algorithm**: Implements the Token Bucket algorithm for rate limiting.
- **Redis Integration**: Supports Redis for distributed rate limiting.
- **In-Memory Fallback**: Uses in-memory storage when Redis is not available.
- **Customizable**: Configure bucket size, refill rate, and custom messages.
- **Request Skipping**: Option to bypass rate limiting for specific requests.


## Installation

You can install the package using npm:

```bash
npm i nodejs-rate-limiter-redis
```
## Usage

```js
const { createRateLimiter } = require('nodejs-rate-limiter-redis');

const rateLimiter = createRateLimiter({
    redisClient: null, // Provide a Redis client if available
    bucketSize: 10,    // Number of tokens in the bucket
    refillRate: 2,     // Tokens per second
    skip: false,       // Option to bypass rate limiting
    message: 'Too many requests, please try again later.' // Custom message
});

// Use as a middleware
app.use(rateLimiter)
```

### Example ( With Redis )

```js
const express = require('express');
const Redis = require('ioredis');
const {createRateLimiter} = require('nodejs-rate-limiter-redis')
const app = express();

// Create a Redis Client 
// Here We are using "ioredis", you may use any of Redis client

const redisClient = new Redis('YOUR_REDIS_URL', {
    password: 'YOUR_REDIS_PASS' || undefined,
    connectTimeout: 5000,
    maxRetriesPerRequest: null,
  })

const rateLimiter = createRateLimiter({
    redisClient,     // Pass the Redis Client
    bucketSize: 10,  // Initial Bucket Size
    refillRate: 1,   //  Tokens added per second,
    message: "You have reached todays limit" ,
    skip: false,    // Bypass Rate Limiting , determine whether or not this request consumes token from client’s bucket
});

app.use(rateLimiter);

app.get('/', (req, res) => {
    res.send('Welcome to the rate-limited API!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

### Example ( Without Redis )

```js
const express = require('express');
const {createRateLimiter} = require('nodejs-rate-limiter-redis')
const app = express();

const rateLimiter = createRateLimiter({
    bucketSize: 10,  // Initial Bucket Size
    refillRate: 1,   //  Tokens added per second,
    message: "You have reached todays limit" ,
    skip: false,    // Bypass Rate Limiting , determine whether or not this request consumes token from client’s bucket
});

app.use(rateLimiter);

app.get('/', (req, res) => {
    res.send('Welcome to the rate-limited API!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```
### Options
| Option                     | Type                             | Remarks                                                                                         |
| -------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`bucketSize`]             | `number`                         | Maximum number of tokens the bucket can hold, and also the initial number of tokens in each user bucket.|
| [`refillRate`]             | `number`                         | Rate at which tokens are added to the bucket per second.                          |
| [`message`]                | `string` \| `json` \| `function` | Response to return when the rate limit is exceeded. Can be a string, JSON object, or a function returning a response.|
| [`redisClient`]            | `Redis Connection`               | A Redis connection to use Redis as the bucket store. If not provided, server memory is used.    |
| [`skip`]                   | `function` \| `boolean`          | A function that returns a boolean or a boolean value itself; true bypasses the limiter for the given request.|

### Caution
Using any rate limiter without a persistent storage like Redis may not be ideal for production environments. The in-memory fallback should be used cautiously, as it does not share rate limits across multiple server instances and can be lost if the server restarts. Consider the implications on your system's memory usage and stability when opting not to use Redis.





