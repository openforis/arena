/**
 * Anonymous capability statistics (opt-in): the payload of POST /api/ai/capability-stats, its validation and its
 * log line. No user, URL, model or survey content can be represented.
 */

export const aiDeviceMemoryBuckets = ['≤2', '4', '8+'] as const
export const aiPromptApiStates = ['unavailable', 'downloadable', 'available'] as const
export const aiLocalServerStats = ['off', 'onDevice', 'orgHosted', 'cloud', 'unreachable'] as const
export const aiBrowserFamilies = ['chrome', 'edge', 'firefox', 'safari', 'other'] as const

export type AiCapabilityStats = {
  webGpu: boolean
  deviceMemoryBucket: (typeof aiDeviceMemoryBuckets)[number] | null
  promptApi: (typeof aiPromptApiStates)[number] | null
  localServer: (typeof aiLocalServerStats)[number]
  browser: (typeof aiBrowserFamilies)[number]
}

const KEYS = ['webGpu', 'deviceMemoryBucket', 'promptApi', 'localServer', 'browser']

const isOneOf = (values: readonly string[], value: unknown): boolean =>
  typeof value === 'string' && values.includes(value)

const isOneOfOrNull = (values: readonly string[], value: unknown): boolean => value === null || isOneOf(values, value)

/**
 * Returns the statistics when the body has exactly the expected keys and values, else null.
 * @param {unknown} body - Request body.
 * @returns {AiCapabilityStats|null} The statistics.
 */
export const parseCapabilityStats = (body: unknown): AiCapabilityStats | null => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const raw = body as Record<string, unknown>
  const keys = Object.keys(raw)
  if (keys.length !== KEYS.length || !KEYS.every((key) => keys.includes(key))) return null
  const valid =
    typeof raw.webGpu === 'boolean' &&
    isOneOfOrNull(aiDeviceMemoryBuckets, raw.deviceMemoryBucket) &&
    isOneOfOrNull(aiPromptApiStates, raw.promptApi) &&
    isOneOf(aiLocalServerStats, raw.localServer) &&
    isOneOf(aiBrowserFamilies, raw.browser)
  return valid ? (raw as AiCapabilityStats) : null
}

/**
 * Returns the log line of the statistics (key=value pairs, fixed order).
 * @param {AiCapabilityStats} stats - Statistics.
 * @returns {string} The line.
 */
export const formatCapabilityStats = (stats: AiCapabilityStats): string =>
  `webGpu=${stats.webGpu} deviceMemory=${stats.deviceMemoryBucket ?? 'unknown'} promptApi=${stats.promptApi ?? 'none'} ` +
  `localServer=${stats.localServer} browser=${stats.browser}`
