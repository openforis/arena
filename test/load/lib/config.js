const path = require('node:path')

const DEFAULT_URL = 'http://localhost:9090'
const DEFAULT_COUNT = 50
const DEFAULT_JOB_TIMEOUT_MS = 120000

const FLAG_DEFS = [
  { flag: '--zip', key: 'zipPath', hasValue: true },
  { flag: '--count', key: 'count', hasValue: true },
  { flag: '--url', key: 'url', hasValue: true },
  { flag: '--email', key: 'email', hasValue: true },
  { flag: '--password', key: 'password', hasValue: true },
  { flag: '--job-timeout', key: 'jobTimeoutMs', hasValue: true },
  { flag: '--keep', key: 'keep', hasValue: false },
  { flag: '--help', key: 'help', hasValue: false },
]

const HELP_TEXT = `Usage: node test/load/surveyImportStressTest.js --zip <path> [options]

Options:
  --zip <path>          Path to an Arena survey export/backup zip (required)
  --count <n>           Number of concurrent import requests (default: ${DEFAULT_COUNT})
  --url <base>          Arena server base URL (default: ${DEFAULT_URL}, env: ARENA_URL)
  --email <email>       Login email (env: ARENA_EMAIL / ADMIN_EMAIL)
  --password <password> Login password (env: ARENA_PASSWORD / ADMIN_PASSWORD)
  --job-timeout <ms>    Max time to wait for each import job (default: ${DEFAULT_JOB_TIMEOUT_MS})
  --keep                Do not delete the surveys created by this run
  --help                Show this help message

Notes:
  The server processes survey-creation/import jobs one at a time, globally,
  regardless of --count. This tool produces burst request concurrency, not
  concurrent execution; expect long runs and 'timed-out' outcomes at high
  --count. The throwaway user accounts this tool creates cannot be deleted
  via the API and accumulate in the database across runs (see test/load/README.md).
`

/**
 * Parses raw CLI arguments into a flat object keyed by flag name.
 * @param {Array<string>} argv - Raw CLI arguments (without the node/script path entries).
 * @returns {object} Flag values keyed by their config key.
 */
const parseArgv = (argv) => {
  const parsed = {}
  let index = 0
  while (index < argv.length) {
    const arg = argv[index]
    const flagDef = FLAG_DEFS.find((def) => def.flag === arg)
    if (!flagDef) {
      throw new Error(`Unknown argument: ${arg}`)
    }
    if (flagDef.hasValue) {
      const value = argv[index + 1]
      if (value === undefined) {
        throw new Error(`Missing value for argument: ${arg}`)
      }
      if (value.startsWith('--')) {
        throw new Error(`Missing value for argument: ${arg} (got another flag: ${value})`)
      }
      parsed[flagDef.key] = value
      index += 2
    } else {
      parsed[flagDef.key] = true
      index += 1
    }
  }
  return parsed
}

/**
 * Parses and validates a value as a positive integer.
 * @param {object} params - Function parameters.
 * @param {string|number} params.value - Raw value to parse.
 * @param {string} params.label - Label used in the error message when invalid.
 * @returns {number} The parsed positive integer.
 */
const toPositiveInt = ({ value, label }) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer, got: ${value}`)
  }
  return parsed
}

/**
 * Builds the stress test configuration from CLI arguments and environment variables.
 * @param {object} params - Function parameters.
 * @param {Array<string>} params.argv - Raw CLI arguments (e.g. process.argv.slice(2)).
 * @param {object} params.env - Environment variables (e.g. process.env).
 * @returns {object} Resolved configuration, or { help: true } when --help was passed.
 */
const parseConfig = ({ argv, env }) => {
  const args = parseArgv(argv)

  if (args.help) {
    return { help: true }
  }

  const zipPath = args.zipPath
  if (!zipPath) {
    throw new Error('Missing required argument: --zip <path-to-arena-survey-zip>')
  }

  const url = args.url || env.ARENA_URL || DEFAULT_URL
  const email = args.email || env.ARENA_EMAIL || env.ADMIN_EMAIL
  if (!email) {
    throw new Error('Missing email: pass --email, or set ARENA_EMAIL / ADMIN_EMAIL')
  }
  const password = args.password || env.ARENA_PASSWORD || env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('Missing password: pass --password, or set ARENA_PASSWORD / ADMIN_PASSWORD')
  }

  const count = toPositiveInt({ value: args.count ?? DEFAULT_COUNT, label: '--count' })
  const jobTimeoutMs = toPositiveInt({ value: args.jobTimeoutMs ?? DEFAULT_JOB_TIMEOUT_MS, label: '--job-timeout' })

  return {
    help: false,
    zipPath: path.resolve(zipPath),
    url: url.replace(/\/+$/, ''),
    email,
    password,
    count,
    jobTimeoutMs,
    keep: Boolean(args.keep),
  }
}

module.exports = { parseConfig, HELP_TEXT, DEFAULT_URL, DEFAULT_COUNT, DEFAULT_JOB_TIMEOUT_MS }
