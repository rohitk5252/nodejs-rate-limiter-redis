// Function to create a token bucket
function createTokenBucket(bucketSize, refillRate) {
    return {
        bucketSize,
        tokens: bucketSize,
        refillRate, // tokens per second
        lastRefill: Date.now(),
    };
}

// Function to refill tokens in the bucket
async function refillBucket(bucket, redisClient, userId) {
    const now = Date.now();
    const timeElapsed = (now - bucket.lastRefill) / 1000; // convert ms to seconds
    const newTokens = Math.min(bucket.bucketSize, bucket.tokens + timeElapsed * bucket.refillRate);
    bucket.tokens = newTokens;
    bucket.lastRefill = now;

    await redisClient.hmset(userId, bucket);
}

// Function to try removing a token
async function tryRemoveToken(bucket, redisClient, userId) {
    await refillBucket(bucket, redisClient, userId);

    if (bucket.tokens >= 1) {
        // Remove a token and proceed
        bucket.tokens -= 1;
        await redisClient.hset(userId, 'tokens', bucket.tokens);
        return true;
    } else {
        return false;
    }
}

// Main function to create a rate limiter middleware
function createRateLimiter(options) {
    const redisClient = options.redisClient || undefined;
    const bucketSize = options.bucketSize || 10;
    const refillRate = options.refillRate || 2; // tokens per second

    return async (req, res, next) => {
        const userId = `rate_limiter:${req.ip}` ; // Example: using Stripe user ID from request headers

        if (!req.ip) {
            return res.status(400).send('User ID is required');
        }

        let bucket = await redisClient.hgetall(userId);
        console.log("bucket", bucket, userId)
        if (!bucket || Object.keys(bucket).length === 0) {
            // Initialize the bucket if it doesn't exist
            bucket = createTokenBucket(bucketSize, refillRate);
            await redisClient.hmset(userId, bucket);
        } else {
            bucket = {
                ...bucket,
                tokens: parseFloat(bucket.tokens),
                lastRefill: parseFloat(bucket.lastRefill),
            };
        }

        if (await tryRemoveToken(bucket, redisClient, userId)) {
            next(); // Continue to the next middleware or route handler
        } else {
            res.status(429).send('Too many requests, please try again later.');
        }
    };
}
export default createRateLimiter