import { ApiError } from './types'

/**
 * In-memory demo backend, active when VITE_API_BASE_URL is not set.
 *
 * It simulates the real API on a single device: fake players ("bots") join
 * your lobby, and once the game starts they eliminate each other over time so
 * every screen of the app can be experienced without a server. State lives in
 * this tab only — refreshing the page ends the demo room.
 */

const BOT_NAMES = ['Nova', 'Felix', 'Mara', 'Iris', 'Hugo']
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

const rooms = new Map()

const uid = () => Math.random().toString(36).slice(2, 10)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const latency = () => sleep(200 + Math.random() * 250)
const randomCode = () =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')

function shuffle(input) {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getRoom(code) {
  const room = rooms.get(code.toUpperCase())
  if (!room) throw new ApiError('ROOM_NOT_FOUND', 'Room not found. Double-check the code.', 404)
  return room
}

function getCaller(room, creds) {
  const player = room.players.find((p) => p.id === creds.playerId && p.token === creds.token)
  if (!player) throw new ApiError('UNAUTHORIZED', 'Your session is no longer valid.', 401)
  return player
}

function publicView(p) {
  return { id: p.id, name: p.name, isHost: p.isHost, alive: p.alive, kills: p.kills }
}

/** Pick one entry per player; unique while the pool lasts, then random repeats. */
function dealFromPool(pool, count) {
  const bag = shuffle(pool)
  return Array.from(
    { length: count },
    (_, i) => bag[i] ?? pool[Math.floor(Math.random() * pool.length)],
  )
}

/** Arrange all players into one random cycle and hand out missions. */
function assignMissions(room) {
  const order = shuffle(room.players)
  const scenes = dealFromPool(room.scenes, order.length)
  const items = dealFromPool(room.items, order.length)
  order.forEach((player, i) => {
    const target = order[(i + 1) % order.length]
    player.mission = {
      targetId: target.id,
      targetName: target.name,
      scene: scenes[i],
      item: items[i],
    }
  })
}

/** Apply the victim's death: their assassin inherits their mission. */
function eliminate(room, victim) {
  if (room.status !== 'active') throw new ApiError('GAME_NOT_STARTED', 'The game has not started yet.', 409)
  if (!victim.alive) throw new ApiError('ALREADY_ELIMINATED', 'You are already out of the game.', 409)

  victim.alive = false
  const assassin = room.players.find((p) => p.alive && p.mission?.targetId === victim.id)
  if (assassin) {
    assassin.kills += 1
    assassin.mission = victim.mission
    // Inherited mission pointing at yourself means the circle closed.
    if (assassin.mission?.targetId === assassin.id) assassin.mission = null
  }
  victim.mission = null

  const alive = room.players.filter((p) => p.alive)
  if (alive.length <= 1) {
    room.status = 'finished'
    room.winnerId = alive[0]?.id ?? null
    room.timers.forEach((t) => clearTimeout(t))
    room.timers = []
  }
}

/* ---------------- bot simulation ---------------- */

function scheduleBotJoins(room) {
  const delays = [2500, 6000, 10000, 15000]
  delays.forEach((ms) => {
    const t = window.setTimeout(() => {
      if (room.status !== 'lobby') return
      // skip names already taken (e.g. a host who called themselves "Nova")
      const name = BOT_NAMES.find(
        (n) => !room.players.some((p) => p.name.toLowerCase() === n.toLowerCase()),
      )
      if (!name) return
      room.players.push({
        id: uid(),
        token: uid(),
        name,
        isHost: false,
        alive: true,
        kills: 0,
        isBot: true,
        mission: null,
      })
    }, ms)
    room.timers.push(t)
  })
}

function scheduleBotDeaths(room) {
  const tick = () => {
    if (room.status !== 'active') return

    const humansAlive = room.players.filter((p) => !p.isBot && p.alive)
    // Bots never steal a human's kill: a human's current target only dies last.
    const protectedIds = new Set(humansAlive.map((p) => p.mission?.targetId))
    const candidates = room.players.filter((p) => p.isBot && p.alive && !protectedIds.has(p.id))

    if (candidates.length > 0) {
      eliminate(room, candidates[Math.floor(Math.random() * candidates.length)])
    } else {
      // Only the human and their final target remain — pretend the human
      // completed the mission and the victim reported it.
      const lastBot = room.players.find((p) => p.isBot && p.alive)
      if (lastBot) eliminate(room, lastBot)
    }

    if (room.status === 'active') {
      const delay = humansAlive.length > 0 ? 9000 + Math.random() * 8000 : 4000 + Math.random() * 3000
      room.timers.push(window.setTimeout(tick, delay))
    }
  }
  room.timers.push(window.setTimeout(tick, 12000))
}

/* ---------------- the mock API ---------------- */

export function createMockApi() {
  return {
    async createRoom(payload) {
      await latency()
      const code = randomCode()
      const host = {
        id: uid(),
        token: uid(),
        name: payload.hostName,
        isHost: true,
        alive: true,
        kills: 0,
        isBot: false,
        mission: null,
      }
      const room = {
        code,
        status: 'lobby',
        scenes: payload.scenes,
        items: payload.items,
        players: [host],
        winnerId: null,
        timers: [],
      }
      rooms.set(code, room)
      scheduleBotJoins(room)
      return { code, playerId: host.id, token: host.token }
    },

    async joinRoom(code, name) {
      await latency()
      const room = getRoom(code)
      if (room.status !== 'lobby')
        throw new ApiError('GAME_ALREADY_STARTED', 'This game has already started.', 409)
      if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
        throw new ApiError('NAME_TAKEN', 'That name is already taken in this room.', 409)
      const player = {
        id: uid(),
        token: uid(),
        name,
        isHost: false,
        alive: true,
        kills: 0,
        isBot: false,
        mission: null,
      }
      room.players.push(player)
      return { code: room.code, playerId: player.id, token: player.token }
    },

    async getState(creds) {
      await latency()
      const room = getRoom(creds.code)
      const you = getCaller(room, creds)
      const winner = room.players.find((p) => p.id === room.winnerId)
      return {
        code: room.code,
        status: room.status,
        players: room.players.map(publicView),
        scenes: [...room.scenes],
        items: [...room.items],
        you: publicView(you),
        mission: room.status === 'active' && you.alive && you.mission ? { ...you.mission } : null,
        winner: winner ? publicView(winner) : null,
      }
    },

    async startGame(creds) {
      await latency()
      const room = getRoom(creds.code)
      const you = getCaller(room, creds)
      if (!you.isHost) throw new ApiError('NOT_HOST', 'Only the host can do that.', 403)
      if (room.status !== 'lobby')
        throw new ApiError('GAME_ALREADY_STARTED', 'This game has already started.', 409)
      if (room.players.length < 2)
        throw new ApiError('NOT_ENOUGH_PLAYERS', 'You need at least 2 players to start.', 409)
      room.status = 'active'
      assignMissions(room)
      scheduleBotDeaths(room)
    },

    async reportEliminated(creds) {
      await latency()
      const room = getRoom(creds.code)
      const you = getCaller(room, creds)
      eliminate(room, you)
    },
  }
}
