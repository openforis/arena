const test = require('node:test')
const assert = require('node:assert/strict')

const { buildLoadTestUserCredentials } = require('./userProvisioning')

test('buildLoadTestUserCredentials returns the requested count', () => {
  const credentials = buildLoadTestUserCredentials({ runId: 123, count: 5 })
  assert.equal(credentials.length, 5)
})

test('buildLoadTestUserCredentials produces unique, deterministic emails per index', () => {
  const credentials = buildLoadTestUserCredentials({ runId: 123, count: 3 })
  const emails = credentials.map((c) => c.email)
  assert.deepEqual(emails, [
    'stress_test_123_0@loadtest.local',
    'stress_test_123_1@loadtest.local',
    'stress_test_123_2@loadtest.local',
  ])
})

test('buildLoadTestUserCredentials gives every user a name and a password at least 8 characters long', () => {
  const credentials = buildLoadTestUserCredentials({ runId: 999, count: 2 })
  credentials.forEach((c) => {
    assert.ok(c.name.length > 0)
    assert.ok(c.password.length >= 8)
  })
})

test('buildLoadTestUserCredentials returns an empty array for count 0', () => {
  assert.deepEqual(buildLoadTestUserCredentials({ runId: 1, count: 0 }), [])
})
