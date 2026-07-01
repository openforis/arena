/**
 * Formats a duration in milliseconds into a human-readable string.
 * @param {number} millis - Duration in milliseconds.
 * @returns {string|null} Formatted string (e.g. "23s", "1m 23s", "1h 2m"), or null for non-positive values.
 */
const formatDuration = (millis) => {
  if (millis <= 0) return null
  const totalSeconds = Math.floor(millis / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export default formatDuration
