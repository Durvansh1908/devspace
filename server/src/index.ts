// server/src/index.ts
import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import aiRoutes from "./routes/ai";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
  "http://localhost:1420",
  "http://localhost:5173",
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "DevSpace server running", timestamp: new Date().toISOString() });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

// Socket.io — real-time presence, code collaboration, WebRTC signaling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Project room management
  socket.on("join-project", (data: { projectId: string; user: { id: string; name: string; color: string } }) => {
    socket.join(data.projectId);
    socket.data.user = data.user;
    socket.data.projectId = data.projectId;
    socket.to(data.projectId).emit("user-joined", { socketId: socket.id, user: data.user, timestamp: Date.now() });
    console.log(`Socket ${socket.id} joined project ${data.projectId}`);
  });

  socket.on("leave-project", (projectId: string) => {
    socket.leave(projectId);
    socket.to(projectId).emit("user-left", { socketId: socket.id, timestamp: Date.now() });
  });

  // Code collaboration
  socket.on("code-change", (data: { projectId: string; code: string; domain: string; userId?: string }) => {
    socket.to(data.projectId).emit("code-update", { ...data, timestamp: Date.now() });
  });

  socket.on("cursor-move", (data: { projectId: string; position: { lineNumber: number; column: number }; userId?: string; userName?: string; color?: string }) => {
    socket.to(data.projectId).emit("cursor-update", { ...data, socketId: socket.id, timestamp: Date.now() });
  });

  // WebRTC signaling for calls
  socket.on("call-join", (data: { roomId: string; user: { id: string; name: string } }) => {
    socket.join(`call-${data.roomId}`);
    socket.to(`call-${data.roomId}`).emit("call-user-joined", { socketId: socket.id, user: data.user });
  });

  socket.on("call-leave", (roomId: string) => {
    socket.leave(`call-${roomId}`);
    socket.to(`call-${roomId}`).emit("call-user-left", { socketId: socket.id });
  });

  socket.on("webrtc-offer", (data: { to: string; offer: RTCSessionDescriptionInit }) => {
    io.to(data.to).emit("webrtc-offer", { from: socket.id, offer: data.offer });
  });

  socket.on("webrtc-answer", (data: { to: string; answer: RTCSessionDescriptionInit }) => {
    io.to(data.to).emit("webrtc-answer", { from: socket.id, answer: data.answer });
  });

  socket.on("webrtc-ice", (data: { to: string; candidate: RTCIceCandidateInit }) => {
    io.to(data.to).emit("webrtc-ice", { from: socket.id, candidate: data.candidate });
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.data.projectId) {
      socket.to(socket.data.projectId).emit("user-left", { socketId: socket.id });
    }
    console.log("User disconnected:", socket.id);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

httpServer.listen(PORT, () => {
  console.log(`DevSpace server running on port ${PORT} (${NODE_ENV})`);
});

export { io };