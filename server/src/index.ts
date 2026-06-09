import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:1420",
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: "http://localhost:1420" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "DevSpace server running" });
});

// Socket.io — real-time presence
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-project", (projectId: string) => {
    socket.join(projectId);
    socket.to(projectId).emit("user-joined", { socketId: socket.id });
    console.log(`Socket ${socket.id} joined project ${projectId}`);
  });

  socket.on("leave-project", (projectId: string) => {
    socket.leave(projectId);
    socket.to(projectId).emit("user-left", { socketId: socket.id });
  });

  socket.on("code-change", (data: { projectId: string; code: string; domain: string }) => {
    socket.to(data.projectId).emit("code-update", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`DevSpace server running on port ${PORT}`);
});

export { io };