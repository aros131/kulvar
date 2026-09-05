// middleware/maybeAuth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function maybeAuth(req, _res, next) {
  try {
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name email");
      if (user) req.user = user;   // attach but don't require
    }
  } catch {
    // ignore invalid/expired token → request remains public
  }
  next();
}
