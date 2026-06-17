---
name: Discord embed limits
description: Hard Discord API limits to respect when any bot command builds embeds from variable/multi-record data
---

# Discord embed limits

When building embeds from user-supplied or multi-record data, cap content or the API rejects the message with `Invalid Form Body`.

- Embed description: max 4096 chars
- Each field value: max 1024 chars
- Free-text slash options that feed embeds: add `.setMaxLength(...)` on the option

**Why:** `/incident` history/recent concatenate up to 15 records with unbounded `details`; without caps a long record set silently fails the command at reply time (caught only in code review, not by typecheck/build).

**How to apply:** For any list-style embed, join lines with a running length budget (~3800 to leave headroom) and surface an "N more not shown" footer instead of dumping everything. Truncate per-record text before joining.
