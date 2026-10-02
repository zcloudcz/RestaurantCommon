import { createServer, preview } from "vite";
import { configFor } from "./config.mjs";
const id = process.argv[2] ?? "burger";
const config = configFor(id);
const portArg = process.argv.indexOf("--port");
if (portArg >= 0) {
  const port = Number(process.argv[portArg + 1]);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid port");
  config.server.port = port;
  config.preview.port = port;
}
const server = await (process.argv.includes("--preview")
  ? preview(config)
  : createServer(config));
if ("listen" in server) await server.listen();
server.printUrls();
