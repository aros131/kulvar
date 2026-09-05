// backend/middleware/authMiddleware.js (ESM)
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function extractToken(req) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) return h.split(" ")[1];
  return req.cookies?.token || null; // ok if you also support cookie auth
}

async function loadUser(req, res) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token provided" });
    return null;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.sub;
    if (!userId) {
      res.status(401).json({ message: "Invalid token payload" });
      return null;
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return null;
    }
    return user;
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ message: "Not authorized, token failed" });
    return null;
  }
}

// ✅ default export = function (what your routes call `protect`)
export default async function protect(req, res, next) {
  const user = await loadUser(req, res);
  if (!user) return;            // response already sent
  req.user = user;
  next();
}

// ✅ named exports (so other routes that import these keep working)
export async function requireUser(req, res, next) {
  return protect(req, res, next);
}

function isCoach(user) {
  return user?.role === "coach" || user?.isCoach === true || (user?.roles || []).includes("coach");
}

export async function requireCoach(req, res, next) {
  const user = await loadUser(req, res);
  if (!user) return;
  if (!isCoach(user)) return res.status(403).json({ message: "Forbidden: coach role required" });
  req.user = user;
  next();
}
