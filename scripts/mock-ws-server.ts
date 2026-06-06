import { WebSocketServer } from "ws";
import fixture from "../data/fixtures/mock-session.json";

const wss = new WebSocketServer({ port: 8000, path: "/ws/session" });

wss.on("connection", (ws) => {
  console.log("[mock] client connected");
  let audioFrames = 0;

  ws.on("message", async (data, isBinary) => {
    if (isBinary) {
      audioFrames++;
      return;
    }
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "start") {
        console.log("[mock] start", msg.models);
      } else if (msg.type === "stop") {
        console.log(
          `[mock] stop after ${audioFrames} audio frames; replaying fixture`,
        );
        await replay(ws);
      }
    } catch (err) {
      console.error("[mock] bad message", err);
    }
  });

  ws.on("close", () => console.log("[mock] client disconnected"));
});

async function replay(ws: import("ws").WebSocket) {
  for (const event of fixture.events) {
    if (event.delayMs) await sleep(event.delayMs);
    ws.send(JSON.stringify(event.msg));
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log("[mock] ws://localhost:8000/ws/session");
