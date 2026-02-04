/**
 * ========================================
 * MAIN SERVER FILE - Entry Point
 * ========================================
 */

import express from "express";
import { createWebServer } from "./utils/serverFactory.js";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { prisma } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serverRoutes from "./routes/serverRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { startServerCodeCron } from "./jobs/serverCodeCron.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  setupSocketHandlers,
  setupPresenceHandlers,
} from "./socket/socketHandlers.js";
dotenv.config();
const app = express();
const httpServer = createWebServer(app);

// ============================================
// Socket .io
// ============================================

let io;

try {
  console.log("Creating Socket.io server...");
  
  const socketOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : ["http://localhost:5173"];
  
  console.log("Socket.io allowed origins:", socketOrigins);

  io = new Server(httpServer, {
    cors: {
      origin: socketOrigins,
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });
  console.log("Socket.io server created!");

  // Setup Socket.io handlers immediately after creation
  setupSocketHandlers(io);
  setupPresenceHandlers(io);
  console.log("Socket.io handlers ready!");
} catch (error) {
  console.error("Failed to setup Socket.io:", error);
  console.warn(" Real-time messaging will NOT work");
}

// Start cron jobs (non-blocking - don't let this prevent server startup)
setTimeout(() => {
  try {
    startServerCodeCron();
    console.log("⏰ Server code regeneration cron job started");
  } catch (error) {
    console.error("⚠️ Failed to start cron jobs:", error.message);
    // Don't crash the server for cron failures
  }
}, 5000); // Delay cron startup by 5 seconds

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(` CORS blocked origin: ${origin}`);
        console.warn(`   Expected one of: ${allowedOrigins.join(", ")}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
    optionsSuccessStatus: 204,
  }),
);

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded data (forms)
app.use(express.urlencoded({ extended: true }));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK (Before other routes for fast response)
// ============================================

// Health check endpoint - Railway uses this to verify the app is running
// Keep this BEFORE other middleware to ensure fast response
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint for basic connectivity check
app.get("/", (req, res) => {
  res.json({
    message: "🌿 ChatWave API is running",
    version: "1.0.0",
    healthCheck: "/health",
  });
});

// ============================================
// ROUTES
// ============================================

// API Routes
app.use("/api/auth", limiter, authRoutes); //Apply limter to authentication
app.use("/api/servers", serverRoutes);
app.use("/api", channelRoutes);
app.use("/api", messageRoutes);

// app.use('/api/me', userProfile)
app.use("/api/users", userRoutes);

// 404 handler (must be AFTER all routes)
app.use(notFoundHandler);

// Error handler (must be LAST)
app.use(errorHandler);

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDatabase = async () => {
  console.log("🔌 Connecting to database...");

  // Add timeout for database connection (15 seconds)
  const connectionTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Database connection timeout")), 15000);
  });

  try {
    // Race between connection and timeout
    await Promise.race([prisma.$connect(), connectionTimeout]);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);

    // Log helpful hints
    if (error.message.includes("timeout")) {
      console.error(
        "💡 Hint: Check if DATABASE_URL is correct and database is accessible",
      );
    }
    if (error.message.includes("ECONNREFUSED")) {
      console.error("💡 Hint: Database server may not be running");
    }

    process.exit(1);
  }
};

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

// IMPORTANT: Bind to 0.0.0.0 for cloud deployments (Railway, Render, etc.)
// - '0.0.0.0' accepts connections from any network interface
// - 'localhost' or '127.0.0.1' only accepts local connections
// - Cloud proxies connect from external IPs, so 0.0.0.0 is required
const HOST = "0.0.0.0";

const startServer = async () => {
  try {
    await connectDatabase();

    httpServer.listen(PORT, HOST, () => {
      console.log(`\n🚀 Server is running at http://${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📡 Accepting connections from all interfaces`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    console.log("Database disconnected");
  } catch (error) {
    console.error("Database disconnect failed:", error);
  }

  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(" Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
