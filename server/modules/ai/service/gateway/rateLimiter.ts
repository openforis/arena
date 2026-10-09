/**
 * In-memory sliding-window limiter (per user, per server process). Protects paid provider keys from
 * runaway loops; deployments with several replicas get limitPerMinute × replicas in the worst case.
 */
const WINDOW_MS = 60_000

export type RateLimiter = { take: (key: string) => boolean }

/**
 * Creates a limiter allowing `limitPerMinute` calls per key in any 60 s window.
 * @param {object} params - Parameters.
 * @param {number} params.limitPerMinute - Max calls per minute (0 or less disables limiting).
 * @param {Function} [params.now] - Clock (tests).
 * @returns {RateLimiter} The limiter.
 */
export const createRateLimiter = ({
  limitPerMinute,
  now = Date.now,
}: {
  limitPerMinute: number
  now?: () => number
}): RateLimiter => {
  const callTimesByKey = new Map<string, number[]>()

  const prune = (key: string, time: number): number[] => {
    const recent = (callTimesByKey.get(key) ?? []).filter((callTime) => time - callTime < WINDOW_MS)
    if (recent.length === 0) callTimesByKey.delete(key)
    else callTimesByKey.set(key, recent)
    return recent
  }

  return {
    take: (key: string): boolean => {
      if (!(limitPerMinute > 0)) return true
      const time = now()
      const recent = prune(key, time)
      if (recent.length >= limitPerMinute) return false
      callTimesByKey.set(key, [...recent, time])
      return true
    },
  }
}
