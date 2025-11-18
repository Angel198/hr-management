// Vercel serverless function wrapper for Express app
import app from "../server/index.js";

// Vercel serverless function handler
export default function handler(req, res) {
  return app(req, res);
}

