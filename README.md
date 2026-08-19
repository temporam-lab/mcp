# @temporam/mcp

Temporam Public API MCP server (stdio) for Cursor, Claude Code, Codex, and other MCP clients.

Calls **`/v3`** on `https://api.temporam.com`. Source: https://github.com/temporam-lab/mcp

## Install

```json
{
  "mcpServers": {
    "temporam": {
      "command": "npx",
      "args": ["-y", "@temporam/mcp"],
      "env": {
        "TEMPORAM_API_KEY": "<API_KEY>",
        "TEMPORAM_API_BASE": "https://api.temporam.com"
      }
    }
  }
}
```

Cursor: `~/.cursor/mcp.json`. Claude Code / Codex use the same `command` + `args` + `env` shape.

| Variable | Required | Description |
|----------|----------|-------------|
| `TEMPORAM_API_KEY` | yes | API key from the Temporam console |
| `TEMPORAM_API_BASE` | no | Defaults to `https://api.temporam.com` |

Keep the key in client env only. Never commit it.

## Receiving vs sending

- **Inbound address:** call `list_domains`, choose a returned domain, and generate a high-entropy local part client-side (for example, a UUID). The address does not need to be created or registered. Give it to the third party, then poll `list_emails` or `get_latest_email`.
- **Outbound sender mailbox:** create one with `create_mailbox` only when you need an active `from` address for `send_message`. Sender mailboxes are not required for receiving.

## Tools

| Tool | API |
|------|-----|
| `list_domains` | `GET /v3/domains` |
| `list_emails` | `GET /v3/emails` |
| `get_latest_email` | `GET /v3/emails/latest` |
| `get_email` | `GET /v3/emails/:id` |
| `create_mailbox` | `POST /v3/mailboxes` |
| `list_mailboxes` | `GET /v3/mailboxes` |
| `get_mailbox` | `GET /v3/mailboxes/:id` |
| `delete_mailbox` | `DELETE /v3/mailboxes/:id` |
| `send_message` | `POST /v3/messages` |
| `get_message` | `GET /v3/messages/:id` |

Inbound read tools may claim mail and consume inbound quota. List results contain summaries; `get_latest_email` and `get_email` return full content. Hobby plans cannot send.
