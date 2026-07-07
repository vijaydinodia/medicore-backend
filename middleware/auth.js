const jwt = require("jsonwebtoken");

/**
 * Verifies the JWT from the Authorization header and attaches
 * the decoded payload to `req.user`.
 */
exports.auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    //check header exists
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    //check Bearer format
    const token = authHeader.startsWith("Bearer")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.status(401).json({ message: "Authentication failed" });
  }
};

/**
 * Role-based authorization middleware.
 * Must be used AFTER `auth` middleware so that `req.user` is available.
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route.
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.get("/admin-only", auth, authorize("admin", "superAdmin"), handler);
 */
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
