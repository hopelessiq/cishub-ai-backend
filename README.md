# CISHub AI backend (starter)

This is a small server scaffold. It keeps the provider API key outside the Flutter app. It is **not publicly deployed**; the chat will not work until a server is hosted and configured.

## Run locally
1. Install Node.js 20 or newer.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env` and add your private API key. Never commit or share `.env`.
4. Run `npm start`.
5. Check `http://localhost:3000/health`.

## Endpoint
`POST /chat` with JSON `{ "message": "..." }`; response `{ "answer": "..." }`.

## Important
- Do not put the API key in Flutter, GitHub, or a ZIP sent to others.
- Add only verified department facts to `knowledge/department.json`.
- The starter knowledge is intentionally small. Course descriptions, staff lists, facilities, and current policies should be added from approved source files before relying on the assistant for those answers.
- Add authentication, rate limiting, request logging without sensitive chat content, and deployment secrets before public production use.
