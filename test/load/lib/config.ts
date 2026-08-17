import path from 'node:path'

/**
 * Strips trailing slashes from a URL. Avoids a regex (e.g. /\/+$/) since a trailing, unanchored-at-start
 * quantifier like that is flagged by static analysis (SonarCloud javascript:S8786) as having potentially
 * super-linear backtracking on pathological input.
 * @param url - The URL to normalize.
 * @returns The URL with any trailing slashes removed.
 */
const stripTrailingSlashes = (url: string): string => {
  let result = url
  while (result.endsWith('/')) {
    result = result.slice(0, -1)
  }
  return result
}

export const DEFAULT_URL = 'http://localhost:9090'
export const DEFAULT_COUNT = 50
export const DEFAULT_JOB_TIMEOUT_MS = 120000

interface FlagDef {
  flag: string
  key: string
  hasValue: boolean
}

const FLAG_DEFS: FlagDef[] = [
  { flag: '--zip', key: 'zipPath', hasValue: true },
  { flag: '--count', key: 'count', hasValue: true },
  { flag: '--url', key: 'url', hasValue: true },
  { flag: '--email', key: 'email', hasValue: true },
  { flag: '--password', key: 'password', hasValue: true },
  { flag: '--job-timeout', key: 'jobTimeoutMs', hasValue: true },
  { flag: '--keep', key: 'keep', hasValue: false },
  { flag: '--help', key: 'help', hasValue: false },
]

export const HELP_TEXT = `Usage: node test/load/surveyImportStressTest.ts --zip <path> [options]

Options:
  --zip <path>          Path to an Arena survey export/backup zip (required)
  --count <n>           Number of concurrent import requests (default: ${DEFAULT_COUNT})
  --url <base>          Arena server base URL (default: ${DEFAULT_URL}, env: ARENA_URL)
  --email <email>       Login email (env: ARENA_EMAIL / ADMIN_EMAIL)
  --password <password> Login password (env: ARENA_PASSWORD / ADMIN_PASSWORD)
  --job-timeout <ms>    Max time to wait for each import job (default: ${DEFAULT_JOB_TIMEOUT_MS})
  --keep                Do not delete the surveys and users created by this run
  --help                Show this help message

Notes:
  The server processes survey-creation/import jobs one at a time, globally,
  regardless of --count. This tool produces burst request concurrency, not
  concurrent execution; expect long runs and 'timed-out' outcomes at high
  --count. Surveys and throwaway user accounts created by this run are
  deleted afterward unless --keep is passed.
`

type ParsedArgs = Record<string, string | boolean | undefined>

/**
 * Parses raw CLI arguments into a flat object keyed by flag name.
 * @param argv - Raw CLI arguments (without the node/script path entries).
 * @returns Flag values keyed by their config key.
 */
const parseArgv = (argv: string[]): ParsedArgs => {
  const parsed: ParsedArgs = {}
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
 * @param params - Function parameters.
 * @param params.value - Raw value to parse.
 * @param params.label - Label used in the error message when invalid.
 * @returns The parsed positive integer.
 */
const toPositiveInt = ({ value, label }: { value: string | number; label: string }): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer, got: ${value}`)
  }
  return parsed
}

export interface StressTestConfig {
  help: false
  zipPath: string
  url: string
  email: string
  password: string
  count: number
  jobTimeoutMs: number
  keep: boolean
}

export type ParseConfigResult = { help: true } | StressTestConfig

/**
 * Builds the stress test configuration from CLI arguments and environment variables.
 * @param params - Function parameters.
 * @param params.argv - Raw CLI arguments (e.g. process.argv.slice(2)).
 * @param params.env - Environment variables (e.g. process.env).
 * @returns Resolved configuration, or { help: true } when --help was passed.
 */
export const parseConfig = ({ argv, env }: { argv: string[]; env: NodeJS.ProcessEnv }): ParseConfigResult => {
  const args = parseArgv(argv)

  if (args.help) {
    return { help: true }
  }

  const zipPath = args.zipPath as string | undefined
  if (!zipPath) {
    throw new Error('Missing required argument: --zip <path-to-arena-survey-zip>')
  }

  const url = (args.url as string) || env.ARENA_URL || DEFAULT_URL
  const email = (args.email as string) || env.ARENA_EMAIL || env.ADMIN_EMAIL
  if (!email) {
    throw new Error('Missing email: pass --email, or set ARENA_EMAIL / ADMIN_EMAIL')
  }
  const password = (args.password as string) || env.ARENA_PASSWORD || env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('Missing password: pass --password, or set ARENA_PASSWORD / ADMIN_PASSWORD')
  }

  const count = toPositiveInt({ value: (args.count as string) ?? DEFAULT_COUNT, label: '--count' })
  const jobTimeoutMs = toPositiveInt({
    value: (args.jobTimeoutMs as string) ?? DEFAULT_JOB_TIMEOUT_MS,
    label: '--job-timeout',
  })

  return {
    help: false,
    zipPath: path.resolve(zipPath),
    url: stripTrailingSlashes(url),
    email,
    password,
    count,
    jobTimeoutMs,
    keep: Boolean(args.keep),
  }
}
