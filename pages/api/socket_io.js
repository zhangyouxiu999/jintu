import { Server } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const ioHandler = (req, res) => {
  // 1. 检查是否已经初始化过
  if (res.socket.server.io) {
    // console.log("Socket server already running");
  } else {
    console.log("Initializing Socket server...");
    const io = new Server(res.socket.server, {
      path: "/api/socket_io_conn",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      // ... 保持原有逻辑不变
      socket.on("join-room", (room) => {
        socket.join(room);
      });
      socket.on("attendance-update", (data) => {
        socket.broadcast.to(data.room).emit("attendance-sync", data);
      });
      socket.on("order-update", (data) => {
        socket.broadcast.to(data.room).emit("order-sync", data);
      });
      socket.on("announcement-update", (data) => {
        socket.broadcast.to(data.room).emit("announcement-sync", data);
      });
    });
  }

  // 2. 结束初始化请求的响应
  // 因为现在 Socket.io 的 path 是 /api/socket_io_conn，
  // 所以发往 /api/socket_io 的 fetch 请求不会被 Socket.io 拦截，
  // 我们可以在这里安全地返回 200。
  res.status(200).json({ success: true, message: "Socket server initialized" });
};

export default ioHandler;
