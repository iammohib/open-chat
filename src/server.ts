// server/index.ts
import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import http from "http";

interface Message {
  username: string;
  text: string;
  timestamp: string;
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("./public"));

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  ws.on("message", (data: WebSocket.Data) => {
    try {
      const message = JSON.parse(data.toString()) as Message;
      console.log("Received:", message);

      // Broadcast to all clients except sender
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
