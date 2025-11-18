// Vercel serverless function wrapper for Express app
import app from "../server/index.js";

export const config = {
  runtime: "nodejs20.x",
};

export default function handler(req, res) {
  return app(req, res);
}

