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
  
  io = new Server(httpServer, {
    cors: {
      origin: socketOrigins,
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });
  console.log("Socket.io server created!");
  console.log("Socket.io allowed origins:", socketOrigins);

  // Setup Socket.io handlers immediately after creation
  setupSocketHandlers(io);
  setupPresenceHandlers(io);
  console.log("Socket.io handlers ready!");
} catch (error) {
  console.error("Failed to setup Socket.io:", error);
  console.warn(" Real-time messaging will NOT work");
}

try {
  startServerCodeCron();
  console.log("Server code regeneration cron job started");
} catch (error) {
  console.error(" Failed to start cron jobs:", error);
}

// CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
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
    preflightContinue: false,
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
// ROUTES
// ============================================

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

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
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    httpServer.listen(PORT, () => {
      console.log(`\n Server is running at ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
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
