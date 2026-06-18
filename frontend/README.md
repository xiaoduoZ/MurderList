# MurderList — Frontend

Mobile-first web app for **MurderList**, a real-world elimination party game.
Every player gets a secret mission — a target, a scene and a weapon. Catch
your target, they confirm the kill on their phone, you inherit their mission.
Last one standing wins.

Built with Vue 3 (plain JavaScript), Vite, Vue Router and Pinia.
Design language: light "editorial print" theme — warm paper background, ink
text, crimson accent, monospace labels, serif display type (Fraunces), and
CSS-first animations throughout.

## Quick start

```sh
npm install
npm run dev
```

The dev server listens on the local network (`host: true`), so you can open
the printed `Network` URL on your phone to try it.

## Demo mode vs. real backend

The app talks to a backend described in [`../API_SPEC.md`](../API_SPEC.md).

- **No backend configured** → the app runs in **demo mode**: an in-tab
  simulation where fake players join your lobby and play the game out, so the
  whole flow can be experienced on a single device. Demo state lives in
  memory — refreshing the page ends the demo room.
- **Real backend** → copy `.env.example` to `.env` and set:

  ```
  VITE_API_BASE_URL=https://your-api.example.com/api
  ```

  Multi-device play (the actual game) requires the real backend.

## How the app is organized

```
src/
  api/          types.js (ApiError + data-shape docs), http.js (real client),
                mock.js (demo simulation), index.js (picks real vs mock)
  stores/       session.js (player credentials, persisted), room.js (room state + 2.5s polling)
  composables/  toast.js (global toast notifications)
  components/   ChipEditor, QrPanel (ticket + QR), HoldButton, PlayerList, LogoMark, ToastHost
  components/room/  LobbyPanel, MissionPanel, DeadPanel, ResultPanel
  views/        HomeView, CreateView, JoinView, RoomView (switches panels by game status)
```

Key behaviors:

- **QR invites**: the lobby ticket's QR encodes `<origin>/join?code=XXXXXX` —
  players scan it with their phone camera and the join page pre-fills the code.
- **Session resume**: credentials persist in `localStorage`; locking the
  phone or reloading returns the player to their game.
- **Kill confirmation**: the *victim* holds the red button to confirm their
  own death (anti-cheat: killers can't claim kills).
- **Game-start countdown**: when the host starts, every phone shows a synced
  3-2-1 before missions are revealed.
- **Motion**: all animations are CSS transform/opacity, tokenized easings in
  `assets/main.css`, and respect `prefers-reduced-motion`.

## Scripts

```sh
npm run dev          # dev server with HMR
npm run build        # production build (dist/)
npm run preview      # serve the production build locally
```
