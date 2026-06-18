# MurderList — Backend API Specification

The contract between the MurderList frontend (Vue SPA) and the game backend.
The frontend is already built against this spec; implementing it as written
means the app works with zero frontend changes.

## General conventions

- **Format**: JSON request and response bodies, `Content-Type: application/json`.
- **Base URL**: configurable on the frontend via `VITE_API_BASE_URL`
  (e.g. `https://api.example.com/api`). All paths below are relative to it.
- **Authentication**: endpoints marked *(auth)* receive
  `Authorization: Bearer <token>`, where `<token>` is the per-player secret
  returned by *create* or *join*. The token identifies the player — there are
  no user accounts.
- **CORS**: the API must allow cross-origin requests from the frontend's
  origin (the SPA is served from a different host/port), including the
  `Authorization` header.
- **Room codes**: short, uppercase, URL-safe. Recommended: 6 characters from
  an unambiguous alphabet (no `0/O/1/I`), e.g. `ABCDEFGHJKMNPQRSTUVWXYZ23456789`.
  Codes are treated case-insensitively.
- **Polling**: the frontend polls `GET /rooms/{code}` every **2.5 seconds**
  per connected player while a room view is open. No other realtime channel
  is required. (A WebSocket can be added later as an optimization; polling
  must keep working as the fallback.)

### Error format

Non-2xx responses return:

```json
{ "error": { "code": "ROOM_NOT_FOUND", "message": "Human-readable detail" } }
```

The frontend maps `error.code` to friendly UI copy. Expected codes:

| Code                   | HTTP status | When                                            |
| ---------------------- | ----------- | ----------------------------------------------- |
| `ROOM_NOT_FOUND`       | 404         | Unknown room code                               |
| `UNAUTHORIZED`         | 401         | Missing/invalid token for this room             |
| `NAME_TAKEN`           | 409         | Join with a name already used in the room       |
| `GAME_ALREADY_STARTED` | 409         | Join/start after the game left the lobby        |
| `GAME_NOT_STARTED`     | 409         | Elimination reported while still in the lobby   |
| `NOT_HOST`             | 403         | Non-host calls a host-only endpoint             |
| `NOT_ENOUGH_PLAYERS`   | 409         | Start with fewer than 2 players                 |
| `ALREADY_ELIMINATED`   | 409         | Dead player reports elimination again           |
| `VALIDATION`           | 400         | Malformed body (empty name, no scenes/items, …) |

### Input limits (enforced by the frontend, validate server-side too)

- Player name: 1–20 characters, unique per room (case-insensitive).
- Scene/item text: 1–30 characters each; at least 1 scene and 1 item per room.
- Player count: no upper limit.

---

## Endpoints

### 1. Create a room

```
POST /rooms
```

Body:

```json
{
  "hostName": "Alex",
  "scenes": ["Kitchen", "Balcony", "Bathroom"],
  "items": ["Spoon", "Pillow", "Mug"]
}
```

`201 Created`:

```json
{ "code": "ABC123", "playerId": "p_8f3k2", "token": "s3cr3t-h0st-t0ken" }
```

Creates the room in `lobby` status with the host as its first player.
`token` is the host's private credential — generate a cryptographically
random value per player.

### 2. Join a room

```
POST /rooms/{code}/players
```

Body:

```json
{ "name": "Sam" }
```

`201 Created`:

```json
{ "code": "ABC123", "playerId": "p_9x1q7", "token": "s3cr3t-pl4yer-t0ken" }
```

Errors: `ROOM_NOT_FOUND`, `GAME_ALREADY_STARTED`, `NAME_TAKEN`, `VALIDATION`.

### 3. Room state *(auth)* — the polling endpoint

```
GET /rooms/{code}
```

`200 OK`:

```json
{
  "code": "ABC123",
  "status": "active",
  "players": [
    { "id": "p_8f3k2", "name": "Alex", "isHost": true,  "alive": true,  "kills": 1 },
    { "id": "p_9x1q7", "name": "Sam",  "isHost": false, "alive": false, "kills": 0 }
  ],
  "scenes": ["Kitchen", "Balcony", "Bathroom"],
  "items": ["Spoon", "Pillow", "Mug"],
  "you": { "id": "p_8f3k2", "name": "Alex", "isHost": true, "alive": true, "kills": 1 },
  "mission": {
    "targetId": "p_2m4n8",
    "targetName": "Riley",
    "scene": "Balcony",
    "item": "Pillow"
  },
  "winner": null
}
```

Field rules:

- `status`: `"lobby"` → `"active"` → `"finished"` (one-way transitions).
- `you`: the calling player, resolved from the bearer token.
- `mission`: **private to the caller** — computed from the token. It is
  `null` while in the lobby, after the caller dies, and once the game is
  finished. Never expose another player's mission.
- `winner`: `null` until `status` is `"finished"`, then the surviving player.
- `players`: every player ever in the room (the dead stay listed). Order is
  up to the backend; join order is nice for the lobby.

Errors: `ROOM_NOT_FOUND`, `UNAUTHORIZED`.

### 4. Start the game *(auth, host only)*

```
POST /rooms/{code}/start
```

`204 No Content` (or `200` with empty body).

Effects — this is where mission assignment happens:

1. Require `status == "lobby"`, caller is host, player count ≥ 2.
2. Arrange **all** players (host included) into **one single random cycle**:
   shuffle the player list; player *i* targets player *i+1*; the last targets
   the first. A single n-cycle guarantees no two players target each other in
   a closed pair and no sub-circles form — everyone is in one big loop.
3. Give each player a scene and an item for their mission. Draw without
   replacement while the pool lasts (unique per player when
   `len(scenes) >= len(players)`), then allow repeats.
4. Set `status = "active"`.

Errors: `ROOM_NOT_FOUND`, `UNAUTHORIZED`, `NOT_HOST`, `GAME_ALREADY_STARTED`,
`NOT_ENOUGH_PLAYERS`.

### 5. Report own elimination *(auth)* — called by the VICTIM

```
POST /rooms/{code}/eliminations
```

No body. `204 No Content`.

The **victim** reports their own death (anti-cheat by design: a killer cannot
claim a kill — only the person who was caught confirms it).

Effects (should be atomic):

1. Require `status == "active"` and caller `alive == true`.
2. Mark the caller dead; clear their mission.
3. Find the caller's **assassin** — the unique alive player whose
   `mission.targetId` equals the caller's id. Increment the assassin's
   `kills` and hand them the victim's old mission (target, scene, item).
   - Edge case: if the inherited mission targets the assassin themself,
     the circle has closed — only the assassin remains.
4. If exactly one player is left alive: set `status = "finished"` and
   `winner` to that player.

Errors: `ROOM_NOT_FOUND`, `UNAUTHORIZED`, `GAME_NOT_STARTED`,
`ALREADY_ELIMINATED`.

---

## Lifecycle example

```
Host:    POST /rooms                          → code QK7M2P, host token
P2..P5:  POST /rooms/QK7M2P/players           → own tokens
All:     GET  /rooms/QK7M2P (poll, 2.5s)      → lobby grows in realtime
Host:    POST /rooms/QK7M2P/start             → circle dealt, status active
All:     GET  /rooms/QK7M2P (poll)            → each sees their own mission
P3:      POST /rooms/QK7M2P/eliminations      → P3's assassin inherits P3's mission
…
Last:    GET  /rooms/QK7M2P                   → status finished, winner set
```

## Operational notes

- **Persistence**: players refresh pages and lock phones constantly at a
  party — tokens must stay valid for the whole game. The frontend stores its
  token in `localStorage` and resumes via the polling endpoint.
- **Rate**: with N players polling every 2.5 s, expect `N / 2.5` reads/sec
  per room. Don't rate-limit below that.
- **Room cleanup**: expire rooms a few hours after creation or after
  `finished`.

## Optional / future endpoints (not required by the current frontend)

- `DELETE /rooms/{code}` *(host)* — cancel a lobby.
- `DELETE /rooms/{code}/players/{playerId}` *(host)* — kick from lobby.
- WebSocket push of the same room-state payload to replace polling.
