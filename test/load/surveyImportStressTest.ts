/* eslint-disable no-console -- this file's entire purpose is CLI reporting */
import 'dotenv/config'

import fs from 'node:fs'
import path from 'node:path'

import { parseConfig, HELP_TEXT, type ParseConfigResult, type StressTestConfig } from './lib/config.ts'
import {
  login,
  importSurveyZip,
  getJobStatus,
  deleteSurvey,
  fetchSurveysByNamePrefix,
  createUser,
  deleteUser,
  type FetchImpl,
  type Job,
} from './lib/httpApi.ts'
import { buildLoadTestUserCredentials, type UserCredentials } from './lib/userProvisioning.ts'
import { formatSummary, type Outcome, type ResultEntry } from './lib/report.ts'

const JOB_POLL_INTERVAL_MS = 1000
const MAX_CONSECUTIVE_POLL_ERRORS = 3
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled'])

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

interface PolledJob {
  status: string
  surveyId: number | null
  errors: unknown
  result: unknown
  error?: string
}

/**
 * Polls a job until it reaches a terminal status, the timeout elapses, or too many consecutive poll
 * requests fail. Never rejects. surveyId/errors/result are backfilled from the last non-terminal read
 * when the terminal read itself lacks them (the server's terminal job-status response omits them).
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token.
 * @param params.jobUuid - UUID of the job to poll.
 * @param params.timeoutMs - Max time to wait, in milliseconds.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @param [params.pollIntervalMs] - Delay between polls, in milliseconds (defaults to 1000).
 * @returns The last known job summary; status is 'timed-out' or 'rejected-at-http' if polling didn't reach a terminal status.
 */
export const pollJobUntilTerminal = async ({
  baseUrl,
  authToken,
  jobUuid,
  timeoutMs,
  fetchImpl = fetch,
  pollIntervalMs = JOB_POLL_INTERVAL_MS,
}: {
  baseUrl: string
  authToken: string
  jobUuid: string
  timeoutMs: number
  fetchImpl?: FetchImpl
  pollIntervalMs?: number
}): Promise<PolledJob> => {
  const startedAt = Date.now()
  let lastKnownSurveyId: number | null = null
  let lastKnownErrors: unknown = null
  let lastKnownResult: unknown = null
  let consecutivePollErrors = 0
  let lastPollError: Error | null = null

  for (;;) {
    let job: Job | null = null
    try {
      job = await getJobStatus({ baseUrl, authToken, jobUuid, fetchImpl })
      consecutivePollErrors = 0
    } catch (error: any) {
      consecutivePollErrors += 1
      lastPollError = error
      if (consecutivePollErrors > MAX_CONSECUTIVE_POLL_ERRORS) {
        return {
          status: 'rejected-at-http',
          surveyId: lastKnownSurveyId,
          errors: lastKnownErrors,
          result: lastKnownResult,
          error: lastPollError.message,
        }
      }
    }

    if (job && TERMINAL_STATUSES.has(job.status)) {
      return {
        ...job,
        surveyId: job.surveyId || lastKnownSurveyId,
        errors: job.errors || lastKnownErrors,
        result: job.result || lastKnownResult,
      }
    }
    if (job) {
      lastKnownSurveyId = job.surveyId || lastKnownSurveyId
      lastKnownErrors = job.errors || lastKnownErrors
      lastKnownResult = job.result || lastKnownResult
    }

    if (Date.now() - startedAt >= timeoutMs) {
      return {
        status: 'timed-out',
        surveyId: lastKnownSurveyId,
        errors: lastKnownErrors,
        result: lastKnownResult,
      }
    }
    await sleep(pollIntervalMs)
  }
}

/**
 * Runs one survey import request end-to-end (accept + poll to completion) and reports its outcome.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token.
 * @param params.zipBuffer - The survey zip file content.
 * @param params.zipFileName - The file name to send for the zip part.
 * @param params.surveyName - The unique name for the new survey.
 * @param params.index - Index of this request within the run (for reporting).
 * @param params.jobTimeoutMs - Max time to wait for the job to finish.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns A result entry.
 */
export const runSingleImport = async ({
  baseUrl,
  authToken,
  zipBuffer,
  zipFileName,
  surveyName,
  index,
  jobTimeoutMs,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  zipBuffer: Buffer
  zipFileName: string
  surveyName: string
  index: number
  jobTimeoutMs: number
  fetchImpl?: FetchImpl
}): Promise<ResultEntry> => {
  const acceptStartedAt = Date.now()
  let job: Job
  try {
    job = await importSurveyZip({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, fetchImpl })
  } catch (error: any) {
    return {
      index,
      name: surveyName,
      outcome: 'rejected-at-http',
      surveyId: null,
      acceptMs: Date.now() - acceptStartedAt,
      jobMs: null,
      error: error.message,
    }
  }
  const acceptMs = Date.now() - acceptStartedAt

  const jobStartedAt = Date.now()
  const finalJob = await pollJobUntilTerminal({
    baseUrl,
    authToken,
    jobUuid: job.uuid,
    timeoutMs: jobTimeoutMs,
    fetchImpl,
  })
  const jobMs = Date.now() - jobStartedAt

  const outcome = finalJob.status as Outcome
  let error: string | null = null
  if (outcome === 'timed-out') {
    error = `timed out after ${jobTimeoutMs}ms`
  } else if (outcome !== 'succeeded') {
    error = finalJob.error || JSON.stringify(finalJob.errors || finalJob.result || 'unknown error')
  }

  return {
    index,
    name: surveyName,
    outcome,
    surveyId: finalJob.surveyId || null,
    acceptMs,
    jobMs,
    error,
  }
}

/**
 * Creates one throwaway user, logs in as them, then runs their single survey import end-to-end.
 * If user creation or login fails, returns a rejected-at-http result without attempting the import.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.adminAuthToken - JWT auth token of the system admin used to create the user.
 * @param params.credentials - Credentials for the throwaway user.
 * @param params.zipBuffer - The survey zip file content.
 * @param params.zipFileName - The file name to send for the zip part.
 * @param params.surveyName - The unique name for the new survey.
 * @param params.index - Index of this request within the run (for reporting).
 * @param params.jobTimeoutMs - Max time to wait for the job to finish.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns A result entry.
 */
export const runSingleUserImport = async ({
  baseUrl,
  adminAuthToken,
  credentials,
  zipBuffer,
  zipFileName,
  surveyName,
  index,
  jobTimeoutMs,
  fetchImpl = fetch,
}: {
  baseUrl: string
  adminAuthToken: string
  credentials: UserCredentials
  zipBuffer: Buffer
  zipFileName: string
  surveyName: string
  index: number
  jobTimeoutMs: number
  fetchImpl?: FetchImpl
}): Promise<ResultEntry> => {
  // Captured as soon as creation succeeds (not just on overall success) so a later failure (e.g. login)
  // still reports the uuid -- the account already exists on the server and needs cleanup either way.
  let userUuid: string | null = null
  let userAuthToken: string
  try {
    userUuid = await createUser({ baseUrl, authToken: adminAuthToken, ...credentials, fetchImpl })
    userAuthToken = await login({ baseUrl, email: credentials.email, password: credentials.password, fetchImpl })
  } catch (error: any) {
    return {
      index,
      name: surveyName,
      outcome: 'rejected-at-http',
      surveyId: null,
      userUuid,
      acceptMs: null,
      jobMs: null,
      error: `user setup failed: ${error.message}`,
    }
  }

  const result = await runSingleImport({
    baseUrl,
    authToken: userAuthToken,
    zipBuffer,
    zipFileName,
    surveyName,
    index,
    jobTimeoutMs,
    fetchImpl,
  })
  return { ...result, userUuid }
}

/**
 * Deletes every survey belonging to this run, sequentially and best-effort. Authoritative: queries the
 * server for every survey whose name starts with namePrefix rather than relying on surveyIds observed
 * from run results, since a job that timed out while still queued (never observed running) never yields
 * a surveyId even though the server may create the survey once its turn comes.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token (a system admin token can delete any survey).
 * @param params.namePrefix - Prefix shared by every survey name created by this run.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns How many surveys were actually deleted.
 */
export const cleanupSurveys = async ({
  baseUrl,
  authToken,
  namePrefix,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  namePrefix: string
  fetchImpl?: FetchImpl
}): Promise<{ deletedCount: number; totalCount: number }> => {
  const surveys = await fetchSurveysByNamePrefix({ baseUrl, authToken, namePrefix, fetchImpl })
  const surveyIds = surveys.map((survey) => survey.id)
  let deletedCount = 0
  for (const surveyId of surveyIds) {
    try {
      await deleteSurvey({ baseUrl, authToken, surveyId, fetchImpl })
      deletedCount += 1
    } catch (error: any) {
      console.error(`Failed to delete survey ${surveyId}: ${error.message}`)
    }
  }
  return { deletedCount, totalCount: surveyIds.length }
}

/**
 * Deletes every user account created by this run, sequentially and best-effort. A user whose survey
 * failed to clean up earlier in the same run is expected to fail here too -- the server blocks deleting a
 * user who still owns a survey -- so that failure is logged, not swallowed, since it signals the earlier
 * survey cleanup didn't fully succeed.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token (a system admin token can delete any user).
 * @param params.userUuids - UUIDs of the users to delete.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns How many users were actually deleted.
 */
export const cleanupUsers = async ({
  baseUrl,
  authToken,
  userUuids,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  userUuids: string[]
  fetchImpl?: FetchImpl
}): Promise<{ deletedCount: number; totalCount: number }> => {
  let deletedCount = 0
  for (const userUuid of userUuids) {
    try {
      await deleteUser({ baseUrl, authToken, userUuid, fetchImpl })
      deletedCount += 1
    } catch (error: any) {
      console.error(`Failed to delete user ${userUuid}: ${error.message}`)
    }
  }
  return { deletedCount, totalCount: userUuids.length }
}

/**
 * CLI entry point: parses config, runs the concurrent import burst, reports, and cleans up.
 * @returns Resolves when the run is complete; sets process.exitCode on failure.
 */
export const main = async (): Promise<void> => {
  let config: ParseConfigResult
  try {
    config = parseConfig({ argv: process.argv.slice(2), env: process.env })
  } catch (error: any) {
    console.error(error.message)
    console.error(HELP_TEXT)
    process.exitCode = 1
    return
  }

  if (config.help) {
    console.log(HELP_TEXT)
    return
  }

  // TS doesn't narrow assignments made inside a try block, so the discriminated union above stays
  // widened here even though the runtime check just proved it; see microsoft/TypeScript#9998.
  const { zipPath, url, email, password, count, jobTimeoutMs, keep } = config as StressTestConfig

  const targetHostname = new URL(url).hostname
  if (targetHostname !== 'localhost' && targetHostname !== '127.0.0.1') {
    console.warn(
      `⚠️  Target is not localhost (${url}) — this run will create ${count} throwaway accounts with a ` +
        'random password on that server; they will be deleted afterward unless --keep is passed.'
    )
  }

  console.log(`Reading zip file: ${zipPath}`)
  const zipBuffer = fs.readFileSync(zipPath)
  const zipFileName = path.basename(zipPath)

  console.log(`Logging in as ${email} at ${url}...`)
  const adminAuthToken = await login({ baseUrl: url, email, password })

  const runId = Date.now()
  const credentialsList = buildLoadTestUserCredentials({ runId, count })
  console.log(
    `Provisioning ${count} throwaway load-test users and firing ${count} concurrent survey imports (run ${runId})...`
  )

  const startedAt = Date.now()
  const settled = await Promise.allSettled(
    credentialsList.map((credentials, i) =>
      runSingleUserImport({
        baseUrl: url,
        adminAuthToken,
        credentials,
        zipBuffer,
        zipFileName,
        surveyName: `stress_test_${runId}_${i}`,
        index: i,
        jobTimeoutMs,
      })
    )
  )
  const results: ResultEntry[] = settled.map((settledResult, i) =>
    settledResult.status === 'fulfilled'
      ? settledResult.value
      : {
          index: i,
          name: `stress_test_${runId}_${i}`,
          outcome: 'rejected-at-http',
          surveyId: null,
          acceptMs: null,
          jobMs: null,
          error: settledResult.reason?.message || String(settledResult.reason),
        }
  )
  const totalDurationMs = Date.now() - startedAt

  console.log(formatSummary({ results, totalDurationMs }))

  if (!keep) {
    console.log('Cleaning up created surveys...')
    const { deletedCount: deletedSurveysCount, totalCount: totalSurveysCount } = await cleanupSurveys({
      baseUrl: url,
      authToken: adminAuthToken,
      namePrefix: `stress_test_${runId}_`,
    })
    console.log(`Deleted ${deletedSurveysCount}/${totalSurveysCount} surveys created by this run.`)

    console.log('Cleaning up created users...')
    const userUuids = results
      .map((result) => result.userUuid)
      .filter((userUuid): userUuid is string => Boolean(userUuid))
    const { deletedCount: deletedUsersCount, totalCount: totalUsersCount } = await cleanupUsers({
      baseUrl: url,
      authToken: adminAuthToken,
      userUuids,
    })
    console.log(`Deleted ${deletedUsersCount}/${totalUsersCount} users created by this run.`)
  } else {
    console.log('Skipping survey and user cleanup (--keep passed); created surveys and users were left in place.')
  }

  const anyFailed = results.some((result) => result.outcome !== 'succeeded')
  process.exitCode = anyFailed ? 1 : 0
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Stress test failed to run:', error)
    process.exitCode = 1
  })
}
