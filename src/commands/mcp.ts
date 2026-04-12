import { startMcpServer } from "../mcp/server.js";

export default async function mcp(_args: string[]) {
  await startMcpServer();
}
