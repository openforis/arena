/* eslint-disable no-console -- this file's entire purpose is CLI reporting */
require('dotenv').config()

const fs = require('node:fs')
const path = require('node:path')

const { parseConfig, HELP_TEXT } = require('./lib/config')
const { login, importSurveyZip, getJobStatus, deleteSurvey } = require('./lib/httpApi')
const { formatSummary } = require('./lib/report')

const JOB_POLL_INTERVAL_MS = 1000
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled'])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Polls a job until it reaches a terminal status or the timeout elapses.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {string} params.jobUuid - UUID of the job to poll.
 * @param {number} params.timeoutMs - Max time to wait, in milliseconds.
 * @returns {Promise<object>} The last fetched job summary; its status is 'timed-out' if the timeout elapsed first.
 */
const pollJobUntilTerminal = async ({ baseUrl, authToken, jobUuid, timeoutMs }) => {
  const startedAt = Date.now()
  for (;;) {
    const job = await getJobStatus({ baseUrl, authToken, jobUuid })
    if (TERMINAL_STATUSES.has(job.status)) {
      return job
    }
    if (Date.now() - startedAt >= timeoutMs) {
      return { ...job, status: 'timed-out' }
    }
    await sleep(JOB_POLL_INTERVAL_MS)
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
 * @returns {Promise<object>} A result entry (see report.js for the shape).
 */
const runSingleImport = async ({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, index, jobTimeoutMs }) => {
  const acceptStartedAt = Date.now()
  let job
  try {
    job = await importSurveyZip({ baseUrl, authToken, zipBuffer, zipFileName, surveyName })
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
  const finalJob = await pollJobUntilTerminal({ baseUrl, authToken, jobUuid: job.uuid, timeoutMs: jobTimeoutMs })
  const jobMs = Date.now() - jobStartedAt

  const outcome = finalJob.status
  const error = outcome === 'succeeded' ? null : JSON.stringify(finalJob.errors || finalJob.result || 'unknown error')

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
 * Deletes every survey referenced by the given results, best-effort.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token.
 * @param {Array<object>} params.results - Result entries produced by runSingleImport.
 * @returns {Promise<void>} Resolves once every deletion attempt has settled.
 */
const cleanupSurveys = async ({ baseUrl, authToken, results }) => {
  const surveyIds = results.map((result) => result.surveyId).filter(Boolean)
  const cleanupResults = await Promise.allSettled(
    surveyIds.map((surveyId) => deleteSurvey({ baseUrl, authToken, surveyId }))
  )
  cleanupResults.forEach((cleanupResult, i) => {
    if (cleanupResult.status === 'rejected') {
      console.error(`Failed to delete survey ${surveyIds[i]}: ${cleanupResult.reason.message}`)
    }
  })
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

  console.log(`Reading zip file: ${zipPath}`)
  const zipBuffer = fs.readFileSync(zipPath)
  const zipFileName = path.basename(zipPath)

  console.log(`Logging in as ${email} at ${url}...`)
  const authToken = await login({ baseUrl: url, email, password })

  const runId = Date.now()
  console.log(`Firing ${count} concurrent survey imports (run ${runId})...`)

  const startedAt = Date.now()
  const results = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      runSingleImport({
        baseUrl: url,
        authToken,
        zipBuffer,
        zipFileName,
        surveyName: `stress_test_${runId}_${i}`,
        index: i,
        jobTimeoutMs,
      })
    )
  )
  const totalDurationMs = Date.now() - startedAt

  console.log(formatSummary({ results, totalDurationMs }))

  if (!keep) {
    console.log('Cleaning up created surveys...')
    await cleanupSurveys({ baseUrl: url, authToken, results })
  }

  const anyFailed = results.some((result) => result.outcome !== 'succeeded')
  process.exitCode = anyFailed ? 1 : 0
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Stress test failed to run:', error)
    process.exitCode = 1
  })
}

module.exports = { main, runSingleImport, pollJobUntilTerminal, cleanupSurveys }
