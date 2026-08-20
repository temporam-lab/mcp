import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig, request, toolResult } from "../src/client.ts";
import { registerTools } from "../src/tools.ts";

afterEach(() => {
  delete process.env.TEMPORAM_API_KEY;
  delete process.env.TEMPORAM_API_BASE;
});

test("getConfig requires key", () => {
  assert.throws(() => getConfig(), /TEMPORAM_API_KEY/);
});

test("getConfig strips trailing slash on base", () => {
  process.env.TEMPORAM_API_KEY = "k";
  process.env.TEMPORAM_API_BASE = "https://api.temporam.com/";
  assert.equal(getConfig().baseUrl, "https://api.temporam.com");
});

test("request forwards status and error envelope", async () => {
  process.env.TEMPORAM_API_KEY = "k";
  process.env.TEMPORAM_API_BASE = "https://api.temporam.com";
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        error: { type: "invalid_request_error", code: "message_not_found", message: "Message not found" },
      }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;
  try {
    const result = await request("GET", "/v3/messages/abc");
    assert.equal(result.ok, false);
    assert.equal(result.status, 404);
    const out = toolResult(result);
    assert.equal(out.isError, true);
    const payload = JSON.parse(out.content[0].text) as { status: number; error: { code: string } };
    assert.equal(payload.status, 404);
    assert.equal(payload.error.code, "message_not_found");
    assert.equal(out.content[0].text.includes("k"), false);
  } finally {
    globalThis.fetch = original;
  }
});

test("request success returns body without wrapping status", async () => {
  process.env.TEMPORAM_API_KEY = "k";
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ data: [{ domain: "temporam.com" }], meta: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
  try {
    const result = await request("GET", "/v3/domains");
    assert.equal(result.ok, true);
    const out = toolResult(result);
    assert.equal(out.isError, false);
    const payload = JSON.parse(out.content[0].text) as { data: unknown[] };
    assert.equal(payload.data.length, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test("tool descriptions separate inbound addresses from outbound sender mailboxes", () => {
  type ToolConfig = {
    description?: string;
    inputSchema?: Record<string, { description?: string }>;
  };
  const tools = new Map<string, ToolConfig>();
  const server = {
    registerTool(name: string, config: ToolConfig) {
      tools.set(name, config);
    },
  } as unknown as McpServer;

  registerTools(server);

  const getMe = tools.get("get_me");
  assert.match(getMe?.description ?? "", /does not consume quota/i);

  const listEmails = tools.get("list_emails");
  assert.match(listEmails?.description ?? "", /does not need to be created/i);
  assert.match(listEmails?.inputSchema?.email.description ?? "", /inbound address/i);

  const createMailbox = tools.get("create_mailbox");
  assert.match(createMailbox?.description ?? "", /outbound sender/i);
  assert.match(createMailbox?.description ?? "", /not required.*receiv/i);
});
