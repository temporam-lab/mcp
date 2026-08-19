import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { clientError, request, toolResult } from "./client.js";

async function call(
  method: string,
  path: string,
  opts?: { query?: Record<string, string | number | undefined>; json?: unknown },
) {
  try {
    return toolResult(await request(method, path, opts));
  } catch (e) {
    const message = e instanceof Error ? e.message : "request failed";
    return clientError(message);
  }
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "list_domains",
    {
      description:
        "List domains available for inbound addresses. To receive mail, choose a domain and generate a high-entropy local part client-side; do not call create_mailbox. Does not consume quota.",
      inputSchema: {},
    },
    async () => call("GET", "/v3/domains"),
  );

  server.registerTool(
    "list_emails",
    {
      description:
        "List inbound messages for an address on a system domain. The address does not need to be created or registered as a mailbox. May claim unclaimed mail and consume inbound quota. Returns summaries, not full bodies.",
      inputSchema: {
        email: z
          .string()
          .describe("Inbound address generated client-side from a list_domains result; no mailbox creation required"),
        page: z.number().int().min(1).max(100).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ email, page, limit }) =>
      call("GET", "/v3/emails", { query: { email, page, limit } }),
  );

  server.registerTool(
    "get_latest_email",
    {
      description:
        "Get the latest inbound message for an address on a system domain. The address does not need to be created or registered as a mailbox. May consume 1 inbound point if unclaimed. Returns full content.",
      inputSchema: {
        email: z
          .string()
          .describe("Inbound address generated client-side from a list_domains result; no mailbox creation required"),
      },
    },
    async ({ email }) => call("GET", "/v3/emails/latest", { query: { email } }),
  );

  server.registerTool(
    "get_email",
    {
      description:
        "Get one inbound message by UUID. May consume 1 inbound point if unclaimed. Returns full content.",
      inputSchema: {
        id: z.string().describe("Inbox message UUID"),
      },
    },
    async ({ id }) => call("GET", `/v3/emails/${encodeURIComponent(id)}`),
  );

  server.registerTool(
    "create_mailbox",
    {
      description:
        "Create an active outbound sender mailbox for send_message. It is not required to receive inbound mail. Does not consume monthly quota. Counted against MaxMailboxes.",
      inputSchema: {
        domain: z.string().describe("Domain from list_domains"),
        local_part: z.string().optional().describe("Optional local part; omitted → random"),
      },
    },
    async ({ domain, local_part }) =>
      call("POST", "/v3/mailboxes", {
        json: local_part ? { domain, local_part } : { domain },
      }),
  );

  server.registerTool(
    "list_mailboxes",
    {
      description:
        "List the caller's active outbound sender mailboxes. Does not consume monthly quota.",
      inputSchema: {
        page: z.number().int().min(1).max(100).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ page, limit }) => call("GET", "/v3/mailboxes", { query: { page, limit } }),
  );

  server.registerTool(
    "get_mailbox",
    {
      description: "Get one outbound sender mailbox by id (decimal string).",
      inputSchema: {
        id: z.string().describe("Mailbox id"),
      },
    },
    async ({ id }) => call("GET", `/v3/mailboxes/${encodeURIComponent(id)}`),
  );

  server.registerTool(
    "delete_mailbox",
    {
      description:
        "Soft-delete an outbound sender mailbox. It can no longer be used as send from.",
      inputSchema: {
        id: z.string().describe("Mailbox id"),
      },
    },
    async ({ id }) => call("DELETE", `/v3/mailboxes/${encodeURIComponent(id)}`),
  );

  server.registerTool(
    "send_message",
    {
      description:
        "Send one email. Consumes 1 outbound point on success. Not idempotent. Hobby plans cannot send. Provide text and/or html. No attachments.",
      inputSchema: {
        from: z.string().describe("Active outbound sender mailbox address you own"),
        to: z.string(),
        subject: z.string(),
        text: z.string().optional(),
        html: z.string().optional(),
        from_name: z.string().optional(),
        reply_to_message_id: z.string().optional().describe("Claimed inbound message UUID"),
      },
    },
    async (args) => {
      const json: Record<string, string> = {
        from: args.from,
        to: args.to,
        subject: args.subject,
      };
      if (args.text) json.text = args.text;
      if (args.html) json.html = args.html;
      if (args.from_name) json.from_name = args.from_name;
      if (args.reply_to_message_id) json.reply_to_message_id = args.reply_to_message_id;
      return call("POST", "/v3/messages", { json });
    },
  );

  server.registerTool(
    "get_message",
    {
      description:
        "Look up a sent message by id. Does not return body or from_name. Does not consume quota.",
      inputSchema: {
        id: z.string().describe("Outbound message UUID"),
      },
    },
    async ({ id }) => call("GET", `/v3/messages/${encodeURIComponent(id)}`),
  );
}
