# Tool Definitions

- Schema validator: validates strict JSON newsletter contract.
- QA validator: enforces business rules and Tegel constraints.
- Email renderer: produces deterministic Outlook-safe email HTML.
- Web renderer: produces deterministic preview HTML.
- Upload API (`POST /api/upload`): accepts multipart image (`png/jpg/jpeg`), stores in `dist/assets`, returns `{ assetId, filename, relativePath }`.
- Generate API supports publish modes:
  - `preview/local` (active): uses `assets/<filename>` paths for media rendering.
  - `outlook-cid` (TODO for MVP): planned CID image rendering with `.eml` attachments.
