import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import designationRoutes from "./routes/designations.js";
import employeeRoutes from "./routes/employees.js";
import leaveRoutes from "./routes/leaves.js";
import holidayRoutes from "./routes/holidays.js";
import eventRoutes from "./routes/events.js";
import attendanceRoutes from "./routes/attendance.js";
import authRoutes from "./routes/auth.js";
import worksheetRoutes from "./routes/worksheetRoutes.js";
import adminWorksheetRoutes from "./routes/adminWorksheetRoutes.js";
import adminInvoiceRoutes from "./routes/adminInvoiceRoutes.js";
import clientRoutes from "./routes/clients.js";
import typeOfWorkRoutes from "./routes/typeOfWork.js";

dotenv.config();

const app = express();

// Track database connection status (declare early)
let dbConnected = false;

// Get directory paths for serving static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Middleware to check database connection for API routes (informational only)
app.use("/api", (req, res, next) => {
  if (!dbConnected) {
    // Log warning but allow request to proceed (routes will handle errors)
    console.warn(`⚠️  API request to ${req.path} but database is not connected`);
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/worksheet", worksheetRoutes);
app.use("/api/admin/worksheet", adminWorksheetRoutes);
app.use("/api/admin", adminInvoiceRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/type-of-work", typeOfWorkRoutes);

// Health check endpoint (before catch-all route)
app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Serve static files from React app (frontend)
// In production, serve from ../dist (relative to server folder)
// In development, this won't exist, so we'll skip it
const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log("📦 Serving frontend from:", distPath);
  
  // Catch all handler: send back React's index.html file for client-side routing
  // This must be last, after all API routes
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes or health check
    if (req.path.startsWith("/api") || req.path === "/health") {
      return res.status(404).json({ error: "Endpoint not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("⚠️  Frontend dist folder not found. API-only mode.");
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://shruti_db_user:Mr2LQGNLr2o7XRxd@hrms.aeuawyb.mongodb.net/HRMS?retryWrites=true&w=majority";

// Initialize database connection (for both serverless and regular server)
connectToDatabase();

// Export the app for Vercel serverless functions
export default app;

// Only start HTTP server if not in Vercel environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5050;
  let server;

  try {
    server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 API base: http://localhost:${PORT}/api`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error("\n📝 To fix this:");
        console.error(`1. Run: npm run kill-port`);
        console.error(`2. Or manually: lsof -i :${PORT} then kill -9 <PID>`);
        console.error(`3. Or use a different port: PORT=5051 npm run dev\n`);
      } else {
        console.error("❌ Server error:", error.message);
      }
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    if (error.code === "EADDRINUSE") {
      console.error(`\n💡 Port ${PORT} is in use. Run: npm run kill-port\n`);
    }
    process.exit(1);
  }
} else {
  console.log("🌐 Running in Vercel serverless mode");
}

// Database connection function with retry logic
function connectToDatabase(retryCount = 0) {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  mongoose
    .connect(MONGODB_URI, {
      dbName: "HRMS",
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    })
    .then(() => {
      dbConnected = true;
      console.log("✅ Connected to MongoDB");
      console.log(`📊 Database: HRMS`);
    })
    .catch((error) => {
      dbConnected = false;
      console.error("\n❌ Failed to connect to MongoDB");
      
      if (error.message?.includes("whitelist") || error.message?.includes("IP")) {
        console.error("\n⚠️  IP Whitelist Error:");
        console.error("Your current IP address is not whitelisted in MongoDB Atlas.");
        console.error("\n📝 To fix this:");
        console.error("1. Go to: https://cloud.mongodb.com/");
        console.error("2. Navigate to: Network Access (or IP Access List)");
        console.error("3. Click 'Add IP Address'");
        console.error("4. Click 'Add Current IP Address' (or use 0.0.0.0/0 for development)");
        console.error("5. Wait a few minutes for changes to take effect");
        console.error("\n💡 For development, you can allow all IPs: 0.0.0.0/0");
        console.error("   (Not recommended for production)\n");
      } else if (error.message?.includes("authentication")) {
        console.error("\n⚠️  Authentication Error:");
        console.error("Invalid MongoDB credentials. Please check your connection string.");
      } else {
        console.error("Error details:", error.message);
      }
      
      // Retry connection if under max retries
      if (retryCount < maxRetries) {
        console.error(`\n🔄 Retrying connection in ${retryDelay / 1000} seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          connectToDatabase(retryCount + 1);
        }, retryDelay);
      } else {
        console.error("\n⚠️  Max retries reached. Server is running but database is not connected.");
        console.error("   API endpoints will return errors until database connection is established.");
        console.error("   Please fix the MongoDB connection and restart the server.\n");
      }
    });
}

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  dbConnected = false;
  console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
  connectToDatabase();
});

mongoose.connection.on("error", (error) => {
  dbConnected = false;
  console.error("❌ MongoDB connection error:", error.message);
});


