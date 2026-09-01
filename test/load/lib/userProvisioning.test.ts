import test from 'node:test'
import assert from 'node:assert/strict'

import { buildLoadTestUserCredentials, generateLoadTestUserPassword } from './userProvisioning.ts'

// Mirrors core/user/userPasswordValidator.ts's passwordStrengthRegExp (and validPasswordRegExp, implied by
// \S+ matching within .{8,} here since no whitespace-containing password could match this shape anyway).
const PASSWORD_STRENGTH_REGEXP = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d).{8,}$/
const NO_WHITESPACE_REGEXP = /^\S+$/

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

test('buildLoadTestUserCredentials gives every user a name and a password satisfying the server strength rules', () => {
  const credentials = buildLoadTestUserCredentials({ runId: 999, count: 2 })
  credentials.forEach((c) => {
    assert.ok(c.name.length > 0)
    assert.match(c.password, NO_WHITESPACE_REGEXP)
    assert.match(c.password, PASSWORD_STRENGTH_REGEXP)
  })
})

test('buildLoadTestUserCredentials shares one randomized password across every user in the same run', () => {
  const credentials = buildLoadTestUserCredentials({ runId: 999, count: 3 })
  const passwords = new Set(credentials.map((c) => c.password))
  assert.equal(passwords.size, 1)
})

test('buildLoadTestUserCredentials generates a different password on each call, proving it is randomized and not hardcoded', () => {
  const first = buildLoadTestUserCredentials({ runId: 1, count: 1 })[0].password
  const second = buildLoadTestUserCredentials({ runId: 2, count: 1 })[0].password
  assert.notEqual(first, second)
})

test('generateLoadTestUserPassword produces a password matching the server password validator regexes', () => {
  for (let i = 0; i < 20; i += 1) {
    const password = generateLoadTestUserPassword()
    assert.match(password, NO_WHITESPACE_REGEXP)
    assert.match(password, PASSWORD_STRENGTH_REGEXP)
  }
})

test('buildLoadTestUserCredentials returns an empty array for count 0', () => {
  assert.deepEqual(buildLoadTestUserCredentials({ runId: 1, count: 0 }), [])
})
