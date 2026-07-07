const rateLimit = require("express-rate-limit");

/**
 * Standardized rate-limit response builder.
 * Returns JSON matching the project's { success, message } convention.
 */
const limitHandler = (message) => (_req, res) => {
  res.status(429).json({
    success: false,
    message,
  });
};

/**
 * Global baseline limiter — applied to every request.
 * 200 requests per 15-minute window per IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: limitHandler(
    "Too many requests from this IP. Please try again after 15 minutes.",
  ),
});

/**
 * Auth limiter — stricter limit for authentication-related endpoints
 * (login, signup, forget, verifyOtp, resetPassword).
 * 15 requests per 15-minute window per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: limitHandler(
    "Too many authentication attempts. Please try again after 15 minutes.",
  ),
});

/**
 * API limiter — moderate limit for general API routes.
 * 100 requests per 15-minute window per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler(
    "Too many API requests from this IP. Please try again after 15 minutes.",
  ),
});

module.exports = { globalLimiter, authLimiter, apiLimiter };
