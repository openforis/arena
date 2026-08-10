const test = require('node:test')
const assert = require('node:assert/strict')

const { formatSummary } = require('./report')

const baseResult = { index: 0, name: 'stress_test_0', outcome: 'succeeded', acceptMs: 100, jobMs: 500, error: null }

test('formatSummary counts outcomes and reports latency stats', () => {
  const results = [
    { ...baseResult, index: 0, name: 's0' },
    { ...baseResult, index: 1, name: 's1', acceptMs: 200, jobMs: 1000 },
    { ...baseResult, index: 2, name: 's2', outcome: 'failed', error: 'boom', acceptMs: 150, jobMs: 300 },
  ]
  const summary = formatSummary({ results, totalDurationMs: 2000 })

  assert.match(summary, /Total requests: 3/)
  assert.match(summary, /succeeded: 2/)
  assert.match(summary, /failed: 1/)
  assert.match(summary, /timed-out: 0/)
})

test('formatSummary lists failure detail lines', () => {
  const results = [{ ...baseResult, index: 4, name: 's4', outcome: 'failed', error: 'pool exhausted' }]
  const summary = formatSummary({ results, totalDurationMs: 500 })

  assert.match(summary, /Failures:/)
  assert.match(summary, /\[4\] s4 - failed: pool exhausted/)
})

test('formatSummary omits the Failures section when everything succeeded', () => {
  const results = [{ ...baseResult }]
  const summary = formatSummary({ results, totalDurationMs: 500 })

  assert.doesNotMatch(summary, /Failures:/)
})

test('formatSummary handles an empty results array', () => {
  const summary = formatSummary({ results: [], totalDurationMs: 0 })
  assert.match(summary, /Total requests: 0/)
})
