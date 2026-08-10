/**
 * Computes summary statistics (min, max, average, p95) for a list of numeric samples.
 * @param {Array<number>} values - Numeric samples (e.g. latencies in milliseconds).
 * @returns {{count: number, min: number|null, max: number|null, avg: number|null, p95: number|null}} Summary statistics; all fields are null when values is empty.
 */
const computeStats = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return { count: 0, min: null, max: null, avg: null, p95: null }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const count = sorted.length
  const sum = sorted.reduce((total, value) => total + value, 0)
  const p95Index = Math.min(count - 1, Math.ceil(count * 0.95) - 1)

  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    avg: sum / count,
    p95: sorted[p95Index],
  }
}

module.exports = { computeStats }
