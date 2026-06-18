import { createHttpApi } from './http'
import { createMockApi } from './mock'

const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

/** True when no backend is configured and the in-tab demo simulation runs. */
export const isMockApi = !baseUrl

export const api = baseUrl ? createHttpApi(baseUrl) : createMockApi()

export { ApiError } from './types'
