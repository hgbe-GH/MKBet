import path from "node:path";

const authDirectory = path.join(process.cwd(), "tests/e2e/.auth");

export const e2eAuthState = {
  admin: path.join(authDirectory, "admin.json"),
  liveHost: path.join(authDirectory, "live-host.json"),
  liveReader: path.join(authDirectory, "live-reader.json"),
  playerDesktop: path.join(authDirectory, "player-desktop.json"),
  playerMobile: path.join(authDirectory, "player-mobile.json"),
  visual: path.join(authDirectory, "visual.json"),
} as const;

export const e2eBaseUrl = "http://localhost:3100";
