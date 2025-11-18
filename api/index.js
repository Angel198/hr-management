// Vercel serverless function wrapper for Express app
import app from "../server/index.js";

export default function handler(req, res) {
  return app(req, res);
}

