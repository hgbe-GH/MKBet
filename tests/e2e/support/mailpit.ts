import { setTimeout as delay } from "node:timers/promises";

import { z } from "zod";

const mailpitUrl = "http://127.0.0.1:54324";

const addressSchema = z.object({ Address: z.string().email() });
const messagesSchema = z.object({
  messages: z.array(
    z.object({
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

function extractAuthLink(content: string, kind: AuthMailKind): string | null {
  const normalized = content.replaceAll("&amp;", "&");
  const links = normalized.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  return links.find((link) => link.includes(`type=${kind}`)) ?? null;
}

export async function waitForAuthEmailLink(
  recipient: string,
  kind: AuthMailKind,
): Promise<string> {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    const messagesResponse = await fetch(`${mailpitUrl}/api/v1/messages`);
    if (!messagesResponse.ok) {
      throw new Error("Mailpit messages are unavailable.");
    }

    const inbox = messagesSchema.parse(await messagesResponse.json());
    const messageSummary = inbox.messages.find((message) =>
      message.To.some((address) => address.Address === recipient),
    );

    if (messageSummary) {
      const messageResponse = await fetch(
        `${mailpitUrl}/api/v1/message/${encodeURIComponent(messageSummary.ID)}`,
      );
      if (!messageResponse.ok) {
        throw new Error("Mailpit message is unavailable.");
      }
      const message = messageSchema.parse(await messageResponse.json());
      const link =
        extractAuthLink(message.HTML, kind) ??
        extractAuthLink(message.Text, kind);
      if (link) return link;
    }

    await delay(250);
  }

  throw new Error("Expected authentication email was not received.");
}
