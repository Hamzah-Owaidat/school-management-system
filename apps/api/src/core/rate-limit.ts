import rateLimit, { type Options } from "express-rate-limit";
import { rateLimited } from "./errors.js";

export interface RateLimitRule {
  windowMs: number;
  limit: number;
}

export interface RateLimitConfig {
  loginPerIp: RateLimitRule;
  loginPerIpAndEmail: RateLimitRule;
  forgotPasswordPerIp: RateLimitRule;
  forgotPasswordPerEmail: RateLimitRule;
  resetPerIp: RateLimitRule;
  verifyPerIp: RateLimitRule;
  verificationRequestPerUser: RateLimitRule;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * express-rate-limit's default in-memory store is fine for one API instance. Running more
 * than one instance behind a load balancer will need a shared store (e.g. Redis), or each
 * instance enforces its own independent limit.
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  loginPerIp: { windowMs: 15 * MINUTE_MS, limit: 50 },
  loginPerIpAndEmail: { windowMs: 15 * MINUTE_MS, limit: 10 },
  forgotPasswordPerIp: { windowMs: HOUR_MS, limit: 20 },
  forgotPasswordPerEmail: { windowMs: HOUR_MS, limit: 5 },
  resetPerIp: { windowMs: 15 * MINUTE_MS, limit: 10 },
  verifyPerIp: { windowMs: 15 * MINUTE_MS, limit: 10 },
  verificationRequestPerUser: { windowMs: HOUR_MS, limit: 5 },
};

export interface RateLimiterOptions extends RateLimitRule {
  keyGenerator?: Options["keyGenerator"];
}

/** Turns an over-limit request into the shared error shape, with a Retry-After header. */
export function createRateLimiter({ windowMs, limit, keyGenerator }: RateLimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (_req, _res, next) => {
      next(rateLimited("Too many requests. Please try again later."));
    },
  });
}
