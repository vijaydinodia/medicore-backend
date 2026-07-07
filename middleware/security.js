const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const crypto = require("crypto");

/**
 * Applies all security middleware to the Express app.
 * Call this early in the middleware chain, before routes.
 *
 * @param {import('express').Application} app
 */
function applySecurity(app) {
  // ── HTTP Security Headers ──────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Cloudinary image embeds
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // ── Remove X-Powered-By ────────────────────────────────────
  // Helmet does this by default, but being explicit for clarity
  app.disable("x-powered-by");

  // ── HTTP Parameter Pollution Protection ────────────────────
  app.use(hpp());

  // ── NoSQL Injection Sanitization ───────────────────────────
  // Strips $ and . from req.body, req.query, req.params
  app.use(
    mongoSanitize({
      replaceWith: "_",
      onSanitize: ({ req, key }) => {
        console.warn(
          `[SECURITY] Sanitized NoSQL injection attempt in ${key} from ${req.ip}`,
        );
      },
    }),
  );

  // ── Request ID for traceability ────────────────────────────
  app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
  });
}

/**
 * Global error handler — must be registered AFTER all routes.
 * Catches unhandled errors and returns a sanitized response.
 *
 * Express identifies error handlers by their 4-parameter signature,
 * so the `next` parameter must stay even though it's unused.
 */
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, _next) {
  // Log full error server-side for debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    requestId: req.id,
    message: err.message,
    stack: err.stack,
  });

  // CORS rejection
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // Default: hide internal details in production
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "Internal server error" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = { applySecurity, globalErrorHandler };
