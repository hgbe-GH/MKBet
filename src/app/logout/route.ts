import { signOut } from "@/application/auth/actions";

export async function POST() {
  await signOut();
}
