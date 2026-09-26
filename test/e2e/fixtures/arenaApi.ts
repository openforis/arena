import { APIRequestContext, expect, request } from '@playwright/test'

import type { TestUser } from './testUsers'

// GET /api/jobs/:uuid returns a different shape depending on whether the job is running (serialized summary)
// or only queued / just ended (internal job info, without result): rely only on the fields common to both
type JobSummary = {
  uuid: string
  status: string
  errors?: unknown
}

const endedJobStatuses = ['succeeded', 'failed', 'canceled']

export type SurveyCreateParams = {
  name: string
  label: string
  lang?: string
  template?: boolean
}

const jobPollIntervalMs = 250
const jobTimeoutMs = 30_000

/**
 * Thin client of the Arena REST API, used to prepare (and clean up) the data needed by a test
 * without going through the UI.
 */
export class ArenaApi {
  private constructor(
    private readonly requestContext: APIRequestContext,
    private readonly authToken: string
  ) {}

  /**
   * Logs in the specified user and returns an API client authenticated as that user.
   * @param {object} params - Parameters.
   * @param {string} params.baseURL - Arena base URL.
   * @param {TestUser} params.user - User to log in.
   * @returns {Promise<ArenaApi>} - The authenticated API client.
   */
  static async login({ baseURL, user }: { baseURL: string; user: TestUser }): Promise<ArenaApi> {
    const requestContext = await request.newContext({ baseURL })
    const response = await requestContext.post('/auth/login', {
      data: { email: user.email, password: user.password },
    })
    expect(response.ok(), `login of ${user.email} failed: ${response.status()}`).toBeTruthy()
    const { authToken } = await response.json()
    return new ArenaApi(requestContext, authToken)
  }

  async dispose(): Promise<void> {
    await this.requestContext.dispose()
  }

  private get headers() {
    return { Authorization: `Bearer ${this.authToken}` }
  }

  private async get(url: string) {
    const response = await this.requestContext.get(url, { headers: this.headers })
    expect(response.ok(), `GET ${url} failed: ${response.status()}`).toBeTruthy()
    return response.json()
  }

  private async post(url: string, data: unknown) {
    const response = await this.requestContext.post(url, { headers: this.headers, data })
    expect(response.ok(), `POST ${url} failed: ${response.status()}`).toBeTruthy()
    return response.json()
  }

  async waitForJob(jobUuid: string): Promise<JobSummary> {
    const start = Date.now()
    for (;;) {
      const job: JobSummary = await this.get(`/api/jobs/${jobUuid}`)
      // right after being started, the summary of the previous job of the same user can be returned: ignore it
      if (job?.uuid === jobUuid && endedJobStatuses.includes(job.status)) {
        expect(job.status, `job ${jobUuid} did not succeed: ${JSON.stringify(job.errors)}`).toBe('succeeded')
        return job
      }
      if (Date.now() - start > jobTimeoutMs) throw new Error(`job ${jobUuid} did not end in ${jobTimeoutMs}ms`)
      await new Promise((resolve) => setTimeout(resolve, jobPollIntervalMs))
    }
  }

  /**
   * Creates a new survey (and sets it as current survey of the user).
   * @param {SurveyCreateParams} params - Survey info.
   * @returns {Promise<number>} - The id of the survey created.
   */
  async createSurvey({ name, label, lang = 'en', template = false }: SurveyCreateParams): Promise<number> {
    const { job, validation } = await this.post('/api/survey', { name, label, lang, template })
    expect(validation, `survey validation failed: ${JSON.stringify(validation)}`).toBeUndefined()
    await this.waitForJob(job.uuid)
    // the job can be reported as succeeded slightly before the new survey is returned by the surveys list
    let surveyId: number | null = null
    await expect
      .poll(async () => (surveyId = await this.findSurveyIdByName({ name, template })), {
        message: `survey ${name} not found after creation`,
        timeout: 10_000,
      })
      .not.toBeNull()
    return surveyId!
  }

  /**
   * Finds the id of the survey (or template) with the specified name.
   * @param {object} params - Parameters.
   * @param {string} params.name - Survey name.
   * @param {boolean} [params.template] - Whether to look for a template.
   * @returns {Promise<number | null>} - The survey id, or null if not found.
   */
  async findSurveyIdByName({ name, template = false }: { name: string; template?: boolean }): Promise<number | null> {
    const params = new URLSearchParams({ search: name, template: String(template) })
    const { list } = await this.get(`/api/surveys?${params}`)
    const surveyInfo = list.find((item: any) => (item.props?.name ?? item.propsDraft?.name) === name)
    return surveyInfo?.id ?? null
  }

  /**
   * Deletes the survey (or template) with the specified name, if it exists.
   * @param {object} params - Parameters.
   * @param {string} params.name - Survey name.
   * @param {boolean} [params.template] - Whether the survey is a template.
   * @returns {Promise<void>} - Resolves when the survey has been deleted.
   */
  async deleteSurveyByNameIfExists({ name, template = false }: { name: string; template?: boolean }): Promise<void> {
    const surveyId = await this.findSurveyIdByName({ name, template })
    if (surveyId) await this.deleteSurveyIfExists(surveyId)
  }

  /**
   * Deletes the survey with the specified id; it does nothing if the survey does not exist anymore.
   * @param {number} surveyId - Id of the survey to delete.
   * @returns {Promise<void>} - Resolves when the survey has been deleted.
   */
  async deleteSurveyIfExists(surveyId: number): Promise<void> {
    await this.requestContext.delete(`/api/survey/${surveyId}`, { headers: this.headers })
  }
}
