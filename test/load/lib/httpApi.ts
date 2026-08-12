export type FetchImpl = (url: string, options?: RequestInit) => Promise<Response>
export type SleepImpl = (ms: number) => Promise<void>

const defaultSleep: SleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The server rate-limits /auth/login (e.g. 10 requests/30s) to guard against brute-forcing -- expected,
// deliberate behavior that a burst of many concurrent throwaway-user logins from one IP will trigger.
export const LOGIN_RATE_LIMIT_MAX_RETRIES = 5
export const LOGIN_RATE_LIMIT_DEFAULT_RETRY_MS = 2000
export const LOGIN_RATE_LIMIT_MAX_RETRY_MS = 30000

export interface Job {
  uuid: string
  status: string
  surveyId?: number | null
  errors?: unknown
  result?: unknown
}

/**
 * Reads a fetch Response body once as text, and attempts to JSON-parse it.
 * Never throws: falls back to { message: <raw text> } (or {} for an empty body) when the body isn't valid JSON.
 * @param response - The fetch Response to read.
 * @returns The parsed JSON body, or a fallback object wrapping the raw text.
 */
const readBody = async (response: Response): Promise<Record<string, unknown>> => {
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
 * Reads the Retry-After header (seconds) from a 429 response, falling back to a default when the header
 * is absent, and capping the result so a server-supplied value can't stall the caller indefinitely.
 * @param response - The 429 response.
 * @returns The delay to wait before retrying, in milliseconds.
 */
const getRetryDelayMs = (response: Response): number => {
  const retryAfterSeconds = Number(response.headers.get('retry-after'))
  const retryAfterMs =
    Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : LOGIN_RATE_LIMIT_DEFAULT_RETRY_MS
  return Math.min(retryAfterMs, LOGIN_RATE_LIMIT_MAX_RETRY_MS)
}

/**
 * Logs in against the Arena API and returns a bearer auth token. Retries on 429 (the server rate-limits
 * this endpoint), honoring the Retry-After header, up to LOGIN_RATE_LIMIT_MAX_RETRIES times.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL (no trailing slash).
 * @param params.email - Login email.
 * @param params.password - Login password.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @param [params.sleepImpl] - Sleep implementation to use between retries (defaults to a real delay).
 * @returns The JWT auth token.
 */
export const login = async ({
  baseUrl,
  email,
  password,
  fetchImpl = fetch,
  sleepImpl = defaultSleep,
}: {
  baseUrl: string
  email: string
  password: string
  fetchImpl?: FetchImpl
  sleepImpl?: SleepImpl
}): Promise<string> => {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetchImpl(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (response.status === 429 && attempt < LOGIN_RATE_LIMIT_MAX_RETRIES) {
      await sleepImpl(getRetryDelayMs(response))
      continue
    }
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
}

/**
 * Builds the multipart form data for an Arena survey zip import request.
 * @param params - Function parameters.
 * @param params.zipBuffer - The survey zip file content.
 * @param params.zipFileName - The file name to send for the zip part.
 * @param params.surveyName - The unique name for the new survey.
 * @returns The multipart form data ready to send as a fetch body.
 */
export const buildImportFormData = ({
  zipBuffer,
  zipFileName,
  surveyName,
}: {
  zipBuffer: Buffer
  zipFileName: string
  surveyName: string
}): FormData => {
  const formData = new FormData()
  formData.append('survey', JSON.stringify({ name: surveyName, options: { includeData: false } }))
  // Node's Buffer (a Uint8Array subclass) satisfies BlobPart at runtime; the generic ArrayBufferLike
  // parameter between @types/node and the DOM lib's typed arrays doesn't structurally line up, though.
  formData.append('file', new Blob([zipBuffer as unknown as BlobPart], { type: 'application/zip' }), zipFileName)
  return formData
}

/**
 * Starts an Arena survey import job from a zip file.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token from login.
 * @param params.zipBuffer - The survey zip file content.
 * @param params.zipFileName - The file name to send for the zip part.
 * @param params.surveyName - The unique name for the new survey.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns The created job summary (includes uuid and status).
 */
export const importSurveyZip = async ({
  baseUrl,
  authToken,
  zipBuffer,
  zipFileName,
  surveyName,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  zipBuffer: Buffer
  zipFileName: string
  surveyName: string
  fetchImpl?: FetchImpl
}): Promise<Job> => {
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
  if (!body.job?.uuid) {
    throw new Error(`Import request failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  return body.job
}

/**
 * Fetches the current status of a background job.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token from login.
 * @param params.jobUuid - UUID of the job to fetch.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns The job summary.
 */
export const getJobStatus = async ({
  baseUrl,
  authToken,
  jobUuid,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  jobUuid: string
  fetchImpl?: FetchImpl
}): Promise<Job | null> => {
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
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token from login.
 * @param params.surveyId - ID of the survey to delete.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns Resolves when the survey has been deleted.
 */
export const deleteSurvey = async ({
  baseUrl,
  authToken,
  surveyId,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  surveyId: number | string
  fetchImpl?: FetchImpl
}): Promise<void> => {
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
 * Fetches every survey whose name starts with the given prefix, visible to the authenticated user.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token.
 * @param params.namePrefix - Prefix to match against survey names (server does a substring search).
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns The matching surveys.
 */
export const fetchSurveysByNamePrefix = async ({
  baseUrl,
  authToken,
  namePrefix,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  namePrefix: string
  fetchImpl?: FetchImpl
}): Promise<Array<{ id: number }>> => {
  const url = `${baseUrl}/api/surveys?search=${encodeURIComponent(namePrefix)}&draft=true&onlyOwn=false`
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`List surveys failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  const body = await response.json()
  return body.list
}

/**
 * Creates a new user account. The caller must be a system admin.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token of a system admin user.
 * @param params.name - Full name for the new user.
 * @param params.email - Email address for the new user (must be unique).
 * @param params.password - Password for the new user.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns Resolves when the user has been created.
 */
export const createUser = async ({
  baseUrl,
  authToken,
  name,
  email,
  password,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  name: string
  email: string
  password: string
  fetchImpl?: FetchImpl
}): Promise<void> => {
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
  const body = await response.json()
  if (body.validation) {
    throw new Error(`Create user ${email} failed validation: ${JSON.stringify(body.validation)}`)
  }
}
