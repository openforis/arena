/**
 * Reads a fetch Response body once as text, and attempts to JSON-parse it.
 * Never throws: falls back to { message: <raw text> } (or {} for an empty body) when the body isn't valid JSON.
 * @param {Response} response - The fetch Response to read.
 * @returns {Promise<object>} The parsed JSON body, or a fallback object wrapping the raw text.
 */
const readBody = async (response) => {
  const text = await response.text()
  if (!text) {
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

/**
 * Logs in against the Arena API and returns a bearer auth token.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL (no trailing slash).
 * @param {string} params.email - Login email.
 * @param {string} params.password - Login password.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<string>} The JWT auth token.
 */
const login = async ({ baseUrl, email, password, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Login failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  const body = await response.json()
  if (!body.authToken) {
    throw new Error(`Login failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return body.authToken
}

/**
 * Builds the multipart form data for an Arena survey zip import request.
 * @param {object} params - Function parameters.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @returns {FormData} The multipart form data ready to send as a fetch body.
 */
const buildImportFormData = ({ zipBuffer, zipFileName, surveyName }) => {
  const formData = new FormData()
  formData.append('survey', JSON.stringify({ name: surveyName, options: { includeData: false } }))
  formData.append('file', new Blob([zipBuffer], { type: 'application/zip' }), zipFileName)
  return formData
}

/**
 * Starts an Arena survey import job from a zip file.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {Buffer} params.zipBuffer - The survey zip file content.
 * @param {string} params.zipFileName - The file name to send for the zip part.
 * @param {string} params.surveyName - The unique name for the new survey.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} The created job summary (includes uuid and status).
 */
const importSurveyZip = async ({ baseUrl, authToken, zipBuffer, zipFileName, surveyName, fetchImpl = fetch }) => {
  const formData = buildImportFormData({ zipBuffer, zipFileName, surveyName })
  const response = await fetchImpl(`${baseUrl}/api/survey/arena-import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData,
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Import request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  const body = await response.json()
  if (!body.job || !body.job.uuid) {
    throw new Error(`Import request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return body.job
}

/**
 * Fetches the current status of a background job.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {string} params.jobUuid - UUID of the job to fetch.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<object>} The job summary.
 */
const getJobStatus = async ({ baseUrl, authToken, jobUuid, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/api/jobs/${jobUuid}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Job status request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return response.json()
}

/**
 * Deletes a survey.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token from login.
 * @param {number|string} params.surveyId - ID of the survey to delete.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<void>} Resolves when the survey has been deleted.
 */
const deleteSurvey = async ({ baseUrl, authToken, surveyId, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/api/survey/${surveyId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Delete survey ${surveyId} failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
}

/**
 * Creates a new user account. The caller must be a system admin.
 * @param {object} params - Function parameters.
 * @param {string} params.baseUrl - Arena server base URL.
 * @param {string} params.authToken - JWT auth token of a system admin user.
 * @param {string} params.name - Full name for the new user.
 * @param {string} params.email - Email address for the new user (must be unique).
 * @param {string} params.password - Password for the new user.
 * @param {Function} [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns {Promise<void>} Resolves when the user has been created.
 */
const createUser = async ({ baseUrl, authToken, name, email, password, fetchImpl = fetch }) => {
  const response = await fetchImpl(`${baseUrl}/api/user`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: JSON.stringify({ name, email, password, props: { title: 'preferNotToSay' } }),
    }),
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Create user ${email} failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
}

module.exports = { login, buildImportFormData, importSurveyZip, getJobStatus, deleteSurvey, createUser }
