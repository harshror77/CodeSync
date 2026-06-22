import {RateLimiterMiddleware} from '@harshror77/rate-limiter-sdk'
import dotenv from 'dotenv'

dotenv.config();
export const strictRateLimit = RateLimiterMiddleware({
    serviceUrl:process.env.RATE_LIMITER_SERVICE_URL || 'http://localhost:3000',
    apiKey:process.env.RATE_LIMITER_API_KEY || 'free-test-key'
});