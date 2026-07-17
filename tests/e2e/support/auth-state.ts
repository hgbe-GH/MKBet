import path from "node:path";

const authDirectory = path.join(process.cwd(), "tests/e2e/.auth");

export const e2eAuthState = {
  author: path.join(authDirectory, "author.json"),
  validatorA: path.join(authDirectory, "validator-a.json"),
  validatorB: path.join(authDirectory, "validator-b.json"),
  opposer: path.join(authDirectory, "opposer.json"),
} as const;

export const e2eCreatedUsersPath = path.join(
  authDirectory,
  "created-users.json",
);

export const e2eBaseUrl = "http://localhost:3100";
