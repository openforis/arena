/* eslint-disable no-console -- this file's entire purpose is CLI reporting */
require('dotenv').config()

const fs = require('node:fs')
const path = require('node:path')

const { parseConfig, HELP_TEXT } = require('./lib/config')
const {
  login,
  importSurveyZip,
  getJobStatus,
  deleteSurvey,
  fetchSurveysByNamePrefix,
  createUser,
} = require('./lib/httpApi')
const { buildLoadTestUserCredentials } = require('./lib/userProvisioning')
const { formatSummary } = require('./lib/report')

const JOB_POLL_INTERVAL_MS = 1000
const MAX_CONSECUTIVE_POLL_ERRORS = 3
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled'])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Polls a job until it reaches a terminal status, the timeout elapses, or too many consecutive poll
 * requests fail. Never rejects. surveyId/errors/result are backfilled from the last non-terminal read
 * when the terminal read itself lacks them (the server's terminal job-status response omits them).
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {string} params.jobUuid - UUID of the job to poll.
 * @param {number} params.timeoutMs - Max time to wait, in milliseconds.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @param {number} [params.pollIntervalMs] - Delay between polls, in milliseconds (defaults to 1000).
 * @returns {Promise<object>} The last known job summary; status is 'timed-out' or 'rejected-at-http' if polling didn't reach a terminal status.
 */
const pollJobUntilTerminal = async ({
  baseUrl,
  authToken,
  jobUuid,
  timeoutMs,
  fetchImpl = fetch,
  pollIntervalMs = JOB_POLL_INTERVAL_MS,
}) => {
  const startedAt = Date.now()
  let lastKnownSurveyId = null
  let lastKnownErrors = null
  let lastKnownResult = null
  let consecutivePollErrors = 0
  let lastPollError = null

  for (;;) {
    let job = null
    try {
      job = await getJobStatus({ baseUrl, authToken, jobUuid, fetchImpl })
      consecutivePollErrors = 0
    } catch (error) {
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
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @param {number} params.index - Index of this request within the run (for reporting).
 * @param {number} params.jobTimeoutMs - Max time to wait for the job to finish.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} A result entry (see report.js for the shape).
 */
const runSingleImport = async ({
  baseUrl,
  authToken,
  zipBuffer,
  zipFileName,
  surveyName,
  index,
  jobTimeoutMs,
  fetchImpl = fetch,
}) => {
  const acceptStartedAt = Date.now()
  let job
  try {
    job = await importSurveyZip({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, fetchImpl })
  } catch (error) {
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

  const outcome = finalJob.status
  let error = null
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
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.adminAuthToken - JWT auth token of the system admin used to create the user.
 * @param {{name: string, email: string, password: string}} params.credentials - Credentials for the throwaway user.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @param {number} params.index - Index of this request within the run (for reporting).
 * @param {number} params.jobTimeoutMs - Max time to wait for the job to finish.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} A result entry (see report.js for the shape).
 */
const runSingleUserImport = async ({
  baseUrl,
  adminAuthToken,
  credentials,
  zipBuffer,
  zipFileName,
  surveyName,
  index,
  jobTimeoutMs,
  fetchImpl = fetch,
}) => {
  let userAuthToken
  try {
    await createUser({ baseUrl, authToken: adminAuthToken, ...credentials, fetchImpl })
    userAuthToken = await login({ baseUrl, email: credentials.email, password: credentials.password, fetchImpl })
  } catch (error) {
    return {
      index,
      name: surveyName,
      outcome: 'rejected-at-http',
      surveyId: null,
      acceptMs: null,
      jobMs: null,
      error: `user setup failed: ${error.message}`,
    }
  }

  return runSingleImport({
    baseUrl,
    authToken: userAuthToken,
    zipBuffer,
    zipFileName,
    surveyName,
    index,
    jobTimeoutMs,
    fetchImpl,
  })
}

/**
 * Deletes every survey belonging to this run, sequentially and best-effort. Authoritative: queries the
 * server for every survey whose name starts with namePrefix rather than relying on surveyIds observed
 * from run results, since a job that timed out while still queued (never observed running) never yields
 * a surveyId even though the server may create the survey once its turn comes.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token (a system admin token can delete any survey).
 * @param {string} params.namePrefix - Prefix shared by every survey name created by this run.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<{deletedCount: number, totalCount: number}>} How many surveys were actually deleted.
 */
const cleanupSurveys = async ({ baseUrl, authToken, namePrefix, fetchImpl = fetch }) => {
  const surveys = await fetchSurveysByNamePrefix({ baseUrl, authToken, namePrefix, fetchImpl })
  const surveyIds = surveys.map((survey) => survey.id)
  let deletedCount = 0
  for (const surveyId of surveyIds) {
    try {
      await deleteSurvey({ baseUrl, authToken, surveyId, fetchImpl })
      deletedCount += 1
    } catch (error) {
      console.error(`Failed to delete survey ${surveyId}: ${error.message}`)
    }
  }
  return { deletedCount, totalCount: surveyIds.length }
}

/**
 * CLI entry point: parses config, runs the concurrent import burst, reports, and cleans up.
 * @returns {Promise<void>} Resolves when the run is complete; sets process.exitCode on failure.
 */
const main = async () => {
  let config
  try {
    config = parseConfig({ argv: process.argv.slice(2), env: process.env })
  } catch (error) {
    console.error(error.message)
    console.error(HELP_TEXT)
    process.exitCode = 1
    return
  }

  if (config.help) {
    console.log(HELP_TEXT)
    return
  }

  const { zipPath, url, email, password, count, jobTimeoutMs, keep } = config

  const targetHostname = new URL(url).hostname
  if (targetHostname !== 'localhost' && targetHostname !== '127.0.0.1') {
    console.warn(
      `⚠️  Target is not localhost (${url}) — this run will create ${count} throwaway accounts with a ` +
        'random password on that server, and (see test/load/README.md) they cannot be deleted afterward.'
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
  const results = settled.map((settledResult, i) =>
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
    const { deletedCount, totalCount } = await cleanupSurveys({
      baseUrl: url,
      authToken: adminAuthToken,
      namePrefix: `stress_test_${runId}_`,
    })
    console.log(`Deleted ${deletedCount}/${totalCount} surveys created by this run.`)
  } else {
    console.log('Skipping survey cleanup (--keep passed); created surveys were left in place.')
  }
  console.log(
    'Note: the throwaway user accounts created by this run (stress_test_*@loadtest.local) cannot be deleted via the API and remain in the database.'
  )

  const anyFailed = results.some((result) => result.outcome !== 'succeeded')
  process.exitCode = anyFailed ? 1 : 0
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Stress test failed to run:', error)
    process.exitCode = 1
  })
}

module.exports = { main, runSingleImport, runSingleUserImport, pollJobUntilTerminal, cleanupSurveys }
