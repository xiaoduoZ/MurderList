import { ApiError } from './types'

/** Friendly copy for error codes defined in API_SPEC.md. */
const FRIENDLY = {
  ROOM_NOT_FOUND: 'Room not found. Double-check the code.',
  GAME_ALREADY_STARTED: 'This game has already started.',
  GAME_NOT_STARTED: 'The game has not started yet.',
  NAME_TAKEN: 'That name is already taken in this room.',
  NOT_HOST: 'Only the host can do that.',
  NOT_ENOUGH_PLAYERS: 'You need at least 2 players to start.',
  ALREADY_ELIMINATED: 'You are already out of the game.',
  UNAUTHORIZED: 'Your session is no longer valid.',
}

export function createHttpApi(baseUrl) {
  const base = baseUrl.replace(/\/+$/, '')

  async function request(path, init = {}, token) {
    let res
    try {
      res = await fetch(base + path, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    } catch {
      throw new ApiError('NETWORK', 'Network error. Check your connection.')
    }

    if (!res.ok) {
      let code = res.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN'
      let message = `Request failed (${res.status}).`
      try {
        const body = await res.json()
        if (body?.error?.code) code = body.error.code
        message = FRIENDLY[code] ?? body?.error?.message ?? message
      } catch {
        message = FRIENDLY[code] ?? message
      }
      throw new ApiError(code, message, res.status)
    }

    // tolerate both "204 No Content" and "200 with empty body" (see API_SPEC.md)
    if (res.status === 204) return undefined
    const text = await res.text()
    return text ? JSON.parse(text) : undefined
  }

  return {
    createRoom: (payload) => request('/rooms', { method: 'POST', body: JSON.stringify(payload) }),

    joinRoom: (code, name) =>
      request(`/rooms/${encodeURIComponent(code)}/players`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),

    getState: (creds) => request(`/rooms/${encodeURIComponent(creds.code)}`, {}, creds.token),

    startGame: (creds) =>
      request(`/rooms/${encodeURIComponent(creds.code)}/start`, { method: 'POST' }, creds.token),

    reportEliminated: (creds) =>
      request(`/rooms/${encodeURIComponent(creds.code)}/eliminations`, { method: 'POST' }, creds.token),
  }
}
