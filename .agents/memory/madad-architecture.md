---
name: MADAD architecture
description: Durable architectural decisions for the MADAD community-help platform.
---

MADAD keeps its existing local email/password and cookie-session authentication while presenting a new React/Vite frontend backed by a separate Express/Drizzle API.

**Why:** The source product already had working auth and community behavior, and preserving that contract was more important than introducing a new identity provider during the visual modernization.

**How to apply:** Extend the generated OpenAPI contract and MADAD API routes for new community capabilities; keep frontend changes within the MADAD artifact unless the product boundaries change.