# Community board to TikTok: integration contract

The board UI in `community/discussions/discussions.js` is gated by the
community auth service. It does not display **Share to my TikTok** unless
`GET /community/discussions/tiktok/capabilities` succeeds with
`{ "enabled": true, "memberId": "..." }`. A 404, missing configuration, or
service failure leaves the existing discussion and upload flows intact.

This is a community member feature. Do not connect it to the owner's separate
social publishing tokens, approval workflow, scheduler, or scene generation.

## Required service routes

All routes except the OAuth navigation use the existing gateway origin,
credentialed community session, exact origin `https://dreamofdreams.com`,
`Cache-Control: no-store`, and existing preflight rules. Add routes to the
gateway specification and its active configuration only after the service
supports them. Return a non-enabled capability until every posting dependency
is ready.

| Route | Response or request |
| --- | --- |
| `GET /community/discussions/tiktok/capabilities` | `{ "enabled": true, "memberId": "<authenticated member id>" }` only when fully configured. |
| `GET /community/discussions/tiktok/creator?threadId=...&mediaId=...` | `{ "connected": false }` or `{ "connected": true, "creatorName": "...", "modes": ["DIRECT_POST", "MEDIA_UPLOAD"], "privacyOptions": ["SELF_ONLY", ...] }`. Query TikTok's current creator info when rendering direct post settings; return only modes usable for this media type and this account, and current privacy options. |
| `GET /community/discussions/tiktok/connect` | Redirect an authenticated member to TikTok for explicit posting scopes using a cookie bound, one time OAuth state. Return to the discussion board after checking the returned TikTok identity and storing encrypted member credentials. Keep the existing login OAuth and owner's OAuth unchanged. |
| `POST /community/discussions/tiktok/posts` | JSON `{ "threadId": "...", "mediaId": "...", "mode": "DIRECT_POST", "caption": "...", "privacyLevel": "SELF_ONLY", "confirmed": true, "requestId": "<UUID>" }`; server validates session, ownership or uploader consent, creator, mode, privacy, idempotency, and rate limits. Response `{ "attemptId": "...", "status": "PENDING" }` after durable attempt creation. Never return published before TikTok confirms it. |
| `GET /community/discussions/tiktok/posts?threadId=...` | `{ "attempts": [{ "attemptId": "...", "mediaId": "...", "mode": "DIRECT_POST", "status": "PROCESSING" }] }`, newest first and limited to the signed in member. This makes the last posting status visible after reload. |
| `GET /community/discussions/tiktok/posts/status?attemptId=...` | A member may read only their own durable attempt. Return TikTok's actual state mapped to `PENDING`, `PROCESSING`, `INBOX_DELIVERED`, `PUBLISH_COMPLETE`, or `FAILED`. A TikTok inbox delivery means the member must complete posting in TikTok. |

The server must enforce uploader permission at the moment of submission:
the media owner can share their own media; another member can share it only
when `allowTikTokReshare === true`. The UI checks the same rule only for display.
Never transfer a private Drive file to another member without this check.
Preserve a complete attempt record and an idempotency key so a timeout or
refresh cannot silently post twice. Preserve the failure reason without
exposing access tokens, upload URLs, or private Drive identifiers.

TikTok requires `video.publish` for direct posting and `video.upload` for
inbox editing. Member consent must be separate from login's `user.info.basic`.
Store per-member access and refresh tokens encrypted, rotate refresh tokens,
verify the `open_id` on callback, and support reconnection and revocation.
Show only TikTok supplied privacy options and obey current creator restrictions.

Board files are private in the user's shared Google Drive folder. TikTok's
`PULL_FROM_URL` for photos and existing server-side videos requires a
publicly reachable URL under a verified owned domain or URL prefix. The
existing session-protected gateway URL and Google Drive share links are not
eligible. Arrange a short-lived, read-only media delivery URL under a verified
Dream of Dreams domain, with narrow access to the selected media and expiry,
before enabling capability. A static site alone cannot serve this dynamic URL.
Confirm TikTok's sandbox and production app settings independently; unaudited
direct posts can be limited to private visibility.
