import test from 'node:test'
import assert from 'node:assert/strict'

import {
  login,
  buildImportFormData,
  importSurveyZip,
  getJobStatus,
  deleteSurvey,
  fetchSurveysByNamePrefix,
  createUser,
} from './httpApi.ts'

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

test('login resolves the auth token and calls the right endpoint', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return jsonResponse({ authToken: 'tok-123' })
  }

  const authToken = await login({ baseUrl: 'http://x', email: 'a@b.com', password: 'pw', fetchImpl })

  assert.equal(authToken, 'tok-123')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'http://x/auth/login')
  assert.equal(calls[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: 'a@b.com', password: 'pw' })
})

test('login throws with status and body detail on failure', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'bad creds' }, 401)

  await assert.rejects(
    () => login({ baseUrl: 'http://x', email: 'a@b.com', password: 'wrong', fetchImpl }),
    /Login failed \(status 401\).*bad creds/
  )
})

test('buildImportFormData sets the survey and file fields', async () => {
  const formData = buildImportFormData({
    zipBuffer: Buffer.from('zip-bytes'),
    zipFileName: 'survey.zip',
    surveyName: 'stress_test_1',
  })

  const surveyField = JSON.parse(formData.get('survey') as string)
  assert.deepEqual(surveyField, { name: 'stress_test_1', options: { includeData: false } })

  const fileField = formData.get('file') as File
  assert.equal(fileField.name, 'survey.zip')
  const content = Buffer.from(await fileField.arrayBuffer())
  assert.equal(content.toString(), 'zip-bytes')
})

test('importSurveyZip posts multipart form data with the bearer token', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return jsonResponse({ job: { uuid: 'job-1', status: 'pending' } })
  }

  const job = await importSurveyZip({
    baseUrl: 'http://x',
    authToken: 'tok-123',
    zipBuffer: Buffer.from('zip-bytes'),
    zipFileName: 'survey.zip',
    surveyName: 'stress_test_1',
    fetchImpl,
  })

  assert.deepEqual(job, { uuid: 'job-1', status: 'pending' })
  assert.equal(calls[0].url, 'http://x/api/survey/arena-import')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer tok-123')
  assert.ok(calls[0].options.body instanceof FormData)
})

test('importSurveyZip throws when the response has no job', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'pool exhausted' }, 503)

  await assert.rejects(
    () =>
      importSurveyZip({
        baseUrl: 'http://x',
        authToken: 'tok',
        zipBuffer: Buffer.from('x'),
        zipFileName: 'x.zip',
        surveyName: 'n',
        fetchImpl,
      }),
    /Import request failed \(status 503\).*pool exhausted/
  )
})

test('getJobStatus resolves the job summary', async () => {
  const fetchImpl = async () => jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 42 })

  const job = await getJobStatus({ baseUrl: 'http://x', authToken: 'tok', jobUuid: 'job-1', fetchImpl })

  assert.deepEqual(job, { uuid: 'job-1', status: 'succeeded', surveyId: 42 })
})

test('getJobStatus throws on a non-ok response', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'not found' }, 404)

  await assert.rejects(
    () => getJobStatus({ baseUrl: 'http://x', authToken: 'tok', jobUuid: 'missing', fetchImpl }),
    /Job status request failed \(status 404\)/
  )
})

test('deleteSurvey resolves on a successful delete', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return new Response(null, { status: 200 })
  }

  await deleteSurvey({ baseUrl: 'http://x', authToken: 'tok', surveyId: 42, fetchImpl })

  assert.equal(calls[0].url, 'http://x/api/survey/42')
  assert.equal(calls[0].options.method, 'DELETE')
})

test('deleteSurvey throws on a failed delete', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'cannot delete' }, 403)

  await assert.rejects(
    () => deleteSurvey({ baseUrl: 'http://x', authToken: 'tok', surveyId: 42, fetchImpl }),
    /Delete survey 42 failed \(status 403\)/
  )
})

test('login throws with status and raw text when the error body is not JSON', async () => {
  const fetchImpl = async () => new Response('<html><body>Bad Gateway</body></html>', { status: 502 })

  await assert.rejects(
    () => login({ baseUrl: 'http://x', email: 'a@b.com', password: 'pw', fetchImpl }),
    /Login failed \(status 502\).*Bad Gateway/
  )
})

test('login throws with status when the error body is empty', async () => {
  const fetchImpl = async () => new Response(null, { status: 504 })

  await assert.rejects(
    () => login({ baseUrl: 'http://x', email: 'a@b.com', password: 'pw', fetchImpl }),
    /Login failed \(status 504\)/
  )
})

test('importSurveyZip throws with status and raw text when the error body is not JSON', async () => {
  const fetchImpl = async () => new Response('<html>Gateway Timeout</html>', { status: 504 })

  await assert.rejects(
    () =>
      importSurveyZip({
        baseUrl: 'http://x',
        authToken: 'tok',
        zipBuffer: Buffer.from('x'),
        zipFileName: 'x.zip',
        surveyName: 'n',
        fetchImpl,
      }),
    /Import request failed \(status 504\).*Gateway Timeout/
  )
})

test('getJobStatus throws with status and raw text when the error body is not JSON', async () => {
  const fetchImpl = async () => new Response('Service Unavailable', { status: 503 })

  await assert.rejects(
    () => getJobStatus({ baseUrl: 'http://x', authToken: 'tok', jobUuid: 'job-1', fetchImpl }),
    /Job status request failed \(status 503\).*Service Unavailable/
  )
})

test('deleteSurvey throws with status and raw text when the error body is not JSON', async () => {
  const fetchImpl = async () => new Response('<html>Forbidden</html>', { status: 403 })

  await assert.rejects(
    () => deleteSurvey({ baseUrl: 'http://x', authToken: 'tok', surveyId: 42, fetchImpl }),
    /Delete survey 42 failed \(status 403\).*Forbidden/
  )
})

test('fetchSurveysByNamePrefix calls the right endpoint and resolves the list', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return jsonResponse({ list: [{ id: 1 }, { id: 2 }] })
  }

  const surveys = await fetchSurveysByNamePrefix({
    baseUrl: 'http://x',
    authToken: 'tok',
    namePrefix: 'stress_test_123_',
    fetchImpl,
  })

  assert.deepEqual(surveys, [{ id: 1 }, { id: 2 }])
  assert.equal(calls[0].url, 'http://x/api/surveys?search=stress_test_123_&draft=true&onlyOwn=false')
  assert.equal(calls[0].options.method, 'GET')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer tok')
})

test('fetchSurveysByNamePrefix throws with status and body detail on failure', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'not authorized' }, 401)

  await assert.rejects(
    () =>
      fetchSurveysByNamePrefix({ baseUrl: 'http://x', authToken: 'tok', namePrefix: 'stress_test_123_', fetchImpl }),
    /List surveys failed \(status 401\).*not authorized/
  )
})

test('createUser resolves when the response is ok and has no validation field', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return jsonResponse({ user: { id: 1 } })
  }

  await createUser({ baseUrl: 'http://x', authToken: 'tok', name: 'n', email: 'a@b.com', password: 'pw', fetchImpl })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'http://x/api/user')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer tok')
})

test('createUser throws when a 200 response body carries a validation failure', async () => {
  const fetchImpl = async () => jsonResponse({ validation: { fields: { email: { valid: false } } } })

  await assert.rejects(
    () => createUser({ baseUrl: 'http://x', authToken: 'tok', name: 'n', email: 'a@b.com', password: 'pw', fetchImpl }),
    /failed validation/
  )
})

test('createUser throws with status and body detail on a non-ok response', async () => {
  const fetchImpl = async () => jsonResponse({ message: 'not authorized' }, 403)

  await assert.rejects(
    () => createUser({ baseUrl: 'http://x', authToken: 'tok', name: 'n', email: 'a@b.com', password: 'pw', fetchImpl }),
    /Create user a@b.com failed \(status 403\).*not authorized/
  )
})
