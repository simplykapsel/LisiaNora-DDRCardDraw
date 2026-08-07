import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { PeerServer } from "peer";

const APP_PORT = 8080;
const PEER_PORT = 9000;

let signalingServer;

PeerServer(
  {
    host: "0.0.0.0",
    port: PEER_PORT,
    path: "/peerjs",
    corsOptions: { origin: "*" },
  },
  (server) => {
    signalingServer = server;

    const addresses = Object.values(networkInterfaces())
      .flat()
      .filter(
        (address) => address && address.family === "IPv4" && !address.internal,
      )
      .map((address) => `  http://${address.address}:${APP_PORT}/?p2p=lan`);

    console.log("\nLAN P2P is ready. Open this address on every device:");
    console.log(
      addresses.join("\n") || `  http://localhost:${APP_PORT}/?p2p=lan`,
    );
    console.log("\nKeep this terminal and the host computer running.\n");
  },
);

const webpackCli = fileURLToPath(
  new URL("../node_modules/webpack-cli/bin/cli.js", import.meta.url),
);
const appServer = spawn(
  process.execPath,
  [webpackCli, "serve", "--env", "dev=true"],
  { stdio: "inherit" },
);

appServer.on("exit", (code) => {
  signalingServer?.close();
  process.exitCode = code ?? 1;
});

process.on("SIGINT", () => {
  appServer.kill("SIGINT");
  signalingServer?.close();
});

process.on("SIGTERM", () => {
  appServer.kill("SIGTERM");
  signalingServer?.close();
});
