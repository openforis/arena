const test = require('node:test')
const assert = require('node:assert/strict')

const { computeStats } = require('./stats')

test('computeStats returns nulls for an empty array', () => {
  assert.deepEqual(computeStats([]), { count: 0, min: null, max: null, avg: null, p95: null })
})

test('computeStats computes min/max/avg for a simple set', () => {
  const stats = computeStats([10, 20, 30])
  assert.equal(stats.count, 3)
  assert.equal(stats.min, 10)
  assert.equal(stats.max, 30)
  assert.equal(stats.avg, 20)
})

test('computeStats is not affected by input order', () => {
  const stats = computeStats([30, 10, 20])
  assert.equal(stats.min, 10)
  assert.equal(stats.max, 30)
})

test('computeStats computes p95 for a 100-sample set', () => {
  const values = Array.from({ length: 100 }, (_, i) => i + 1) // 1..100
  const stats = computeStats(values)
  assert.equal(stats.p95, 95)
})

test('computeStats handles a single value', () => {
  const stats = computeStats([42])
  assert.deepEqual(stats, { count: 1, min: 42, max: 42, avg: 42, p95: 42 })
})
