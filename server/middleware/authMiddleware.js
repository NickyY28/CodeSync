const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // 1. Check if Authorization header exists
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, unauthorized" });
  }

  // 2. Extract the token (header looks like: "Bearer eyJhbGci...")
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach user payload to request — now any route can use req.user
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

module.exports = protect;