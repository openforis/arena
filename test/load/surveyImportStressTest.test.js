const test = require('node:test')
const assert = require('node:assert/strict')

const {
  runSingleImport,
  runSingleUserImport,
  pollJobUntilTerminal,
  cleanupSurveys,
} = require('./surveyImportStressTest')

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

test('runSingleImport reports a helpful message and no jobMs-style acceptMs distortion when the job times out', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('/api/survey/arena-import')) {
      return jsonResponse({ job: { uuid: 'job-1', status: 'pending' } })
    }
    return jsonResponse({ uuid: 'job-1', status: 'running' })
  }

  const result = await runSingleImport({
    baseUrl: 'http://x',
    authToken: 'tok',
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_2',
    index: 2,
    jobTimeoutMs: 0,
    fetchImpl,
  })

  assert.equal(result.outcome, 'timed-out')
  assert.equal(result.error, 'timed out after 0ms')
})

test('cleanupSurveys queries the server authoritatively by name prefix and deletes everything it finds, tolerating individual failures', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push(url)
    if (url.includes('/api/surveys?')) {
      return jsonResponse({ list: [{ id: 1 }, { id: 2 }, { id: 3 }] })
    }
    if (url.endsWith('/api/survey/2')) {
      return new Response('nope', { status: 500 })
    }
    return new Response(null, { status: 200 })
  }

  const summary = await cleanupSurveys({
    baseUrl: 'http://x',
    authToken: 'tok',
    namePrefix: 'stress_test_123_',
    fetchImpl,
  })

  assert.equal(summary.totalCount, 3)
  assert.equal(summary.deletedCount, 2)
  assert.equal(calls[0], 'http://x/api/surveys?search=stress_test_123_&draft=true&onlyOwn=false')
  assert.equal(calls.length, 4)
})

test('cleanupSurveys deletes surveys the caller never observed a surveyId for (e.g. a job that timed out while still queued)', async () => {
  // Simulates the leak this fix addresses: the run's results never learned this survey's ID (it was still
  // queued when the poll gave up), but the server created it anyway once its turn came. Authoritative
  // cleanup finds and deletes it purely from the name-prefix query, with zero surveyIds ever known locally.
  const calls = []
  const fetchImpl = async (url) => {
    calls.push(url)
    if (url.includes('/api/surveys?')) {
      return jsonResponse({ list: [{ id: 99 }] })
    }
    return new Response(null, { status: 200 })
  }

  const summary = await cleanupSurveys({
    baseUrl: 'http://x',
    authToken: 'tok',
    namePrefix: 'stress_test_456_',
    fetchImpl,
  })

  assert.equal(summary.totalCount, 1)
  assert.equal(summary.deletedCount, 1)
  assert.ok(calls.some((url) => url.endsWith('/api/survey/99')))
})

test('runSingleUserImport creates the user, logs in as them, then imports', async () => {
  const calls = []
  const responses = [
    jsonResponse({ user: { id: 1 } }), // POST /api/user
    jsonResponse({ authToken: 'user-tok' }), // POST /auth/login (as the new user)
    jsonResponse({ job: { uuid: 'job-1', status: 'pending' } }), // import accept
    jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 55 }), // poll (terminal, this server response does include surveyId)
  ]
  let call = 0
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return responses[call++]
  }

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 1', email: 'stress_test_1_0@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_0',
    index: 0,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'succeeded')
  assert.equal(result.surveyId, 55)
  assert.equal(calls[0].url, 'http://x/api/user')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer admin-tok')
  assert.equal(calls[1].url, 'http://x/auth/login')
  assert.equal(calls[2].options.headers.Authorization, 'Bearer user-tok')
})

test('runSingleUserImport returns rejected-at-http when user creation fails, without attempting login or import', async () => {
  const fetchImpl = async () => new Response('quota exceeded', { status: 403 })

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 2', email: 'stress_test_1_1@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_1',
    index: 1,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'rejected-at-http')
  assert.match(result.error, /user setup failed/)
  // acceptMs measures only the import POST's latency elsewhere; a setup failure never got that far, so it
  // must report null (not user-creation+login time) to avoid distorting the report's accept-latency stat.
  assert.equal(result.acceptMs, null)
})
