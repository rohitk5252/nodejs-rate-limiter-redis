// Only user as fallback when redisClient is not passed
const bucketMap = new Map();

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
async function refillBucket(bucket) {
    const now = Date.now();
    const timeElapsed = (now - bucket.lastRefill) / 1000; // convert ms to seconds
    const newTokens = Math.min(bucket.bucketSize, bucket.tokens + timeElapsed * bucket.refillRate);
    bucket.tokens = newTokens;
    bucket.lastRefill = now;


    //await setBucket(userId, bucket, redisClient);
}

// Function to try removing a token
async function tryRemoveToken(bucket, redisClient, userId) {
    await refillBucket(bucket);

    if (bucket.tokens >= 1) {
        // Remove a token and proceed
        bucket.tokens -= 1;
        await setBucket(userId, bucket, redisClient);
       // await redisClient.hset(userId, 'tokens', bucket.tokens);
        return true;
    } else {
        return false;
    }
}

async function getBucket(userId, redisClient) {
    if(!redisClient) {
       return bucketMap.get(userId) || null;
    } else {
        const bucket = await redisClient.hgetall(userId);
        if(!bucket || Object.keys(bucket).length == 0) {
            return null;
        }
        return {
            ...bucket,
            tokens: parseFloat(bucket.tokens),
            lastRefill: parseFloat(bucket.lastRefill),
        };
    }
}


async function setBucket(userId, bucket, redisClient) {
    if(!redisClient) {
        bucketMap.set(userId, bucket);
    } else {
        await redisClient.hmset(userId, bucket);
    } 
}

// Main function to create a rate limiter middleware
function createRateLimiter(options) {

    const redisClient = options.redisClient || null;
    const bucketSize = options.bucketSize || 10;
    const refillRate = options.refillRate || 2; // tokens per second

    return async (req, res, next) => {

        if (options.skip) {
            return next(); // Skip rate limiting if specified
        }

        const userId = `rate_limiter:${req.ip}` ; // Example: using Stripe user ID from request headers

        if (!req.ip) {
            return res.status(400).send('User ID is required');
        }

        let bucket = await getBucket(userId, redisClient)
        
        console.log("bucket", bucket, userId)
        if (!bucket) {
            // Initialize the bucket if it doesn't exist
            bucket = createTokenBucket(bucketSize, refillRate);
            await setBucket(userId, bucket, redisClient);      

        }

        if (await tryRemoveToken(bucket, redisClient, userId)) {
            next(); // Continue to the next middleware or route handler
        } else {
            res.status(429).send(options.message || 'Too many requests, please try again later.');
        }
    };
}
module.exports = { createRateLimiter }