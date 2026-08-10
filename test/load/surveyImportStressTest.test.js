const test = require('node:test')
const assert = require('node:assert/strict')

const { runSingleImport, pollJobUntilTerminal, cleanupSurveys } = require('./surveyImportStressTest')

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

test('pollJobUntilTerminal carries surveyId forward from a non-terminal read when the terminal read lacks it', async () => {
  const responses = [
    jsonResponse({ uuid: 'job-1', status: 'running', surveyId: 42 }),
    jsonResponse({ uuid: 'job-1', status: 'succeeded' }),
  ]
  let call = 0
  const fetchImpl = async () => responses[call++]

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 5000,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'succeeded')
  assert.equal(job.surveyId, 42)
})

test('pollJobUntilTerminal tolerates a transient poll error and then succeeds', async () => {
  let call = 0
  const fetchImpl = async () => {
    call += 1
    if (call === 1) {
      throw new Error('ECONNRESET')
    }
    return jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 7 })
  }

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 5000,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'succeeded')
  assert.equal(job.surveyId, 7)
})

test('pollJobUntilTerminal gives up after too many consecutive poll errors, well before the timeout', async () => {
  const fetchImpl = async () => {
    throw new Error('ECONNRESET')
  }

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 60000,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'rejected-at-http')
  assert.match(job.error, /ECONNRESET/)
})

test('pollJobUntilTerminal times out when the job never reaches a terminal status', async () => {
  const fetchImpl = async () => jsonResponse({ uuid: 'job-1', status: 'running' })

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 0,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'timed-out')
})

test('pollJobUntilTerminal does not crash on a null job read and keeps polling', async () => {
  const responses = [jsonResponse(null), jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 9 })]
  let call = 0
  const fetchImpl = async () => responses[call++]

  const job = await pollJobUntilTerminal({
    baseUrl: 'http://x',
    authToken: 'tok',
    jobUuid: 'job-1',
    timeoutMs: 5000,
    pollIntervalMs: 1,
    fetchImpl,
  })

  assert.equal(job.status, 'succeeded')
  assert.equal(job.surveyId, 9)
})

test('runSingleImport returns rejected-at-http when the import request itself fails', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'pool exhausted' }, 503)

  const result = await runSingleImport({
    baseUrl: 'http://x',
    authToken: 'tok',
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_0',
    index: 0,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'rejected-at-http')
  assert.equal(result.surveyId, null)
  assert.equal(result.jobMs, null)
  assert.ok(result.acceptMs >= 0)
})

test('runSingleImport succeeds end-to-end and carries the surveyId through even though the terminal poll lacks it', async () => {
  const responses = [
    jsonResponse({ job: { uuid: 'job-1', status: 'pending' } }), // import accept
    jsonResponse({ uuid: 'job-1', status: 'running', surveyId: 99 }), // poll 1 (active)
    jsonResponse({ uuid: 'job-1', status: 'succeeded' }), // poll 2 (terminal, no surveyId)
  ]
  let call = 0
  const fetchImpl = async () => responses[call++]

  const result = await runSingleImport({
    baseUrl: 'http://x',
    authToken: 'tok',
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1',
    index: 1,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'succeeded')
  assert.equal(result.surveyId, 99)
})

test('cleanupSurveys deletes only entries with a surveyId and tolerates individual failures', async () => {
  const deleteCalls = []
  const fetchImpl = async (url, options) => {
    deleteCalls.push(url)
    if (url.endsWith('/api/survey/2')) {
      return new Response('nope', { status: 500 })
    }
    return new Response(null, { status: 200 })
  }

  const results = [{ surveyId: 1 }, { surveyId: null }, { surveyId: 2 }, { surveyId: 3 }]

  const summary = await cleanupSurveys({ baseUrl: 'http://x', authToken: 'tok', results, fetchImpl })

  assert.equal(summary.totalCount, 3)
  assert.equal(summary.deletedCount, 2)
  assert.equal(deleteCalls.length, 3)
})
