import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'

import { parseConfig, DEFAULT_URL, DEFAULT_COUNT, DEFAULT_JOB_TIMEOUT_MS, type StressTestConfig } from './config.ts'

const baseEnv = {}

test('parseConfig throws when --zip is missing', () => {
  assert.throws(() => parseConfig({ argv: [], env: baseEnv }), /Missing required argument: --zip/)
})

test('parseConfig throws when email is missing', () => {
  assert.throws(() => parseConfig({ argv: ['--zip', 'survey.zip'], env: baseEnv }), /Missing email/)
})

test('parseConfig throws when password is missing', () => {
  assert.throws(
    () => parseConfig({ argv: ['--zip', 'survey.zip', '--email', 'a@b.com'], env: baseEnv }),
    /Missing password/
  )
})

test('parseConfig applies defaults when only required args are passed', () => {
  const config = parseConfig({
    argv: ['--zip', 'survey.zip', '--email', 'a@b.com', '--password', 'pw'],
    env: baseEnv,
  }) as StressTestConfig
  assert.equal(config.zipPath, path.resolve('survey.zip'))
  assert.equal(config.url, DEFAULT_URL)
  assert.equal(config.email, 'a@b.com')
  assert.equal(config.password, 'pw')
  assert.equal(config.count, DEFAULT_COUNT)
  assert.equal(config.jobTimeoutMs, DEFAULT_JOB_TIMEOUT_MS)
  assert.equal(config.keep, false)
})

test('parseConfig falls back to env vars for url/email/password', () => {
  const config = parseConfig({
    argv: ['--zip', 'survey.zip'],
    env: { ARENA_URL: 'http://example.test/', ADMIN_EMAIL: 'admin@x.com', ADMIN_PASSWORD: 'secret' },
  }) as StressTestConfig
  assert.equal(config.url, 'http://example.test')
  assert.equal(config.email, 'admin@x.com')
  assert.equal(config.password, 'secret')
})

test('parseConfig strips multiple trailing slashes from --url', () => {
  const config = parseConfig({
    argv: ['--zip', 'survey.zip', '--email', 'a@b.com', '--password', 'pw', '--url', 'http://example.test///'],
    env: baseEnv,
  }) as StressTestConfig
  assert.equal(config.url, 'http://example.test')
})

test('parseConfig reads --count, --job-timeout and --keep', () => {
  const config = parseConfig({
    argv: [
      '--zip',
      'survey.zip',
      '--email',
      'a@b.com',
      '--password',
      'pw',
      '--count',
      '5',
      '--job-timeout',
      '1000',
      '--keep',
    ],
    env: baseEnv,
  }) as StressTestConfig
  assert.equal(config.count, 5)
  assert.equal(config.jobTimeoutMs, 1000)
  assert.equal(config.keep, true)
})

test('parseConfig rejects a non-positive-integer --count', () => {
  assert.throws(
    () =>
      parseConfig({
        argv: ['--zip', 'survey.zip', '--email', 'a@b.com', '--password', 'pw', '--count', '0'],
        env: baseEnv,
      }),
    /--count must be a positive integer/
  )
})

test('parseConfig short-circuits with help:true on --help', () => {
  assert.deepEqual(parseConfig({ argv: ['--help'], env: baseEnv }), { help: true })
})

test('parseConfig rejects unknown flags', () => {
  assert.throws(() => parseConfig({ argv: ['--bogus'], env: baseEnv }), /Unknown argument: --bogus/)
})

test('parseConfig rejects a flag value that is itself another flag, instead of silently swallowing it', () => {
  assert.throws(
    () => parseConfig({ argv: ['--zip', '--count', '--email', 'a@b.com', '--password', 'pw'], env: baseEnv }),
    /Missing value for argument: --zip \(got another flag: --count\)/
  )
})
