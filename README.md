# @temporam/mcp

Temporam Public API MCP server (stdio) for Cursor, Claude Code, Codex, and other MCP clients.

Source: https://github.com/temporam-lab/mcp

## Install

Publish to npm first, then configure your client:

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

| Variable | Required | Description |
|----------|----------|-------------|
| `TEMPORAM_API_KEY` | yes | API key |
| `TEMPORAM_API_BASE` | no | Defaults to `https://api.temporam.com` |

Keep the key in client env only. Never commit it.

End-user install needs **`npm publish`** of `@temporam/mcp`. Pushing this GitHub repo alone is not enough for `npx -y @temporam/mcp`.

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

Inbound read tools may consume inbound quota and may return full message content. Hobby plans cannot send.
