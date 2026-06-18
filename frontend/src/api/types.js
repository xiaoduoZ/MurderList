/**
 * Shared API data shapes — documentation for plain-JavaScript readers.
 * The full backend contract lives in ../../API_SPEC.md.
 *
 * RoomStatus    'lobby' | 'active' | 'finished'
 * PlayerPublic  { id, name, isHost, alive, kills }
 * Mission       { targetId, targetName, scene, item }   — private to one player
 * Credentials   { code, playerId, token }
 * RoomState     {
 *   code, status, players: PlayerPublic[], scenes: string[], items: string[],
 *   you: PlayerPublic, mission: Mission|null, winner: PlayerPublic|null
 * }
 */

export class ApiError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}
