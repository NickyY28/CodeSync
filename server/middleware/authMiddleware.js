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

/*
 * LINE-BY-LINE SYNTAX & WORKFLOW: authMiddleware.js
 *
 * 1. Require JWT: Imports the `jsonwebtoken` package to handle token decryption.
 *
 * 2. Function Setup: Defines an arrow function `protect(req, res, next)` which acts 
 *    as a middleware (security guard) before hitting protected routes.
 *
 * 3. Extract Header: Reads the incoming request headers and stores the `authorization` 
 *    header into the `authHeader` variable.
 *
 * 4. First Condition (if): Checks if the header is missing OR if it doesn't start with 
 *    the exact string "Bearer ". If either is true, it rejects the request instantly 
 *    with a 401 Unauthorized status and stops execution.
 *
 * 5. Split Token: If the condition passes, it splits the string (e.g., "Bearer 123xyz") 
 *    by the space character and extracts the actual token string at index [1].
 *
 * 6. Try-Catch & Verify: Inside the `try` block, it uses `jwt.verify()` along with the 
 *    app's secret key (`JWT_SECRET`). If the token is authentic and hasn't expired, it 
 *    decrypts it and saves the hidden user info into the `decoded` variable.
 *
 * 7. Attach Payload: Executes the crucial step `req.user = decoded`. This specifically 
 *    attaches the user's ID to the ongoing request object, so the final route handler 
 *    doesn't have to fetch user details from the database again.
 *
 * 8. `next()` Call: Calls the built-in `next()` function, which acts as a green signal 
 *    to let the request proceed to its final destination (e.g., the room creation logic).
 *
 * 9. Error Handling (catch): If the token fails verification (tampered/expired) in step 6, 
 *    the execution jumps straight to the `catch (err)` block.
 *    It then returns a 401 "Token invalid or expired" response.
 *
 * 10. Export: Finally, exports the `protect` function so routes like `rooms.js` can 
 *     import and use it as a guard.
 */
