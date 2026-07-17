import {
  deleteLocalUserIds,
  readCreatedUserRegistry,
  removeCreatedUserRegistry,
} from "./support/local-auth-admin";

export default async function globalTeardown(): Promise<void> {
  const userIds = await readCreatedUserRegistry();
  try {
    await deleteLocalUserIds(userIds);
  } finally {
    await removeCreatedUserRegistry();
  }
}
