import { setTimeout as delay } from "node:timers/promises";

import { z } from "zod";

const mailpitUrl = "http://127.0.0.1:54324";
const localSupabaseOrigin = "http://127.0.0.1:54321";
const e2eApplicationOrigin = "http://localhost:3100";

const addressSchema = z.object({ Address: z.string().email() });
const messagesSchema = z.object({
  total: z.number().int().nonnegative(),
  messages: z.array(
    z.object({
      Created: z.string().datetime(),
      ID: z.string().min(1),
      To: z.array(addressSchema),
    }),
  ),
});
const messageSchema = z.object({
  HTML: z.string().default(""),
  Text: z.string().default(""),
});

type AuthMailKind = "recovery" | "signup";

function safeCallbackForKind(
  value: string | null,
  kind: AuthMailKind,
): boolean {
  if (!value) return false;
  try {
    const callback = new URL(value);
    return (
      callback.origin === e2eApplicationOrigin &&
      callback.pathname === "/auth/callback" &&
      callback.searchParams.get("intent") === kind
    );
  } catch {
    return false;
  }
}

export function extractSafeAuthLink(
  content: string,
  kind: AuthMailKind,
): string | null {
  const normalized = content.replaceAll("&amp;", "&");
  const candidates = normalized.match(/https?:\/\/[^\s"'<>]+/g) ?? [];

  for (const candidate of candidates) {
    try {
      const link = new URL(candidate);
      if (
        link.origin === localSupabaseOrigin &&
        link.pathname === "/auth/v1/verify" &&
        link.searchParams.get("type") === kind &&
        safeCallbackForKind(link.searchParams.get("redirect_to"), kind)
      ) {
        return link.toString();
      }
    } catch {
      // Continue scanning later candidates and messages.
    }
  }
  return null;
}

async function listAllMessages(): Promise<
  z.infer<typeof messagesSchema>["messages"]
> {
  const summaries: z.infer<typeof messagesSchema>["messages"] = [];
  const limit = 100;
  let start = 0;

  while (true) {
    const response = await fetch(
      `${mailpitUrl}/api/v1/messages?limit=${limit}&start=${start}`,
    );
    if (!response.ok) throw new Error("Mailpit messages are unavailable.");
    const page = messagesSchema.parse(await response.json());
    summaries.push(...page.messages);
    if (summaries.length >= page.total || page.messages.length === 0) break;
    start += page.messages.length;
  }

  return summaries.sort(
    (first, second) => Date.parse(second.Created) - Date.parse(first.Created),
  );
}

export async function waitForAuthEmailLink(
  recipient: string,
  kind: AuthMailKind,
): Promise<string> {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    const recipientMessages = (await listAllMessages()).filter((message) =>
      message.To.some((address) => address.Address === recipient),
    );

    for (const summary of recipientMessages) {
      const response = await fetch(
        `${mailpitUrl}/api/v1/message/${encodeURIComponent(summary.ID)}`,
      );
      if (!response.ok) throw new Error("Mailpit message is unavailable.");
      const message = messageSchema.parse(await response.json());
      const link =
        extractSafeAuthLink(message.HTML, kind) ??
        extractSafeAuthLink(message.Text, kind);
      if (link) return link;
    }

    await delay(250);
  }

  throw new Error("Expected authentication email was not received.");
}
